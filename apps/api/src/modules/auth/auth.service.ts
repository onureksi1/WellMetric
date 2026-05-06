import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
 
import { User } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { Invitation } from './entities/invitation.entity';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { NotificationService } from '../notification/notification.service';
import { BruteForceService } from './brute-force.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class AuthService {
  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly bruteForce: BruteForceService,
    private readonly logger: AppLogger,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async login(dto: LoginDto, ip: string) {
    const { email, password } = dto;
    this.logger.debug('Login isteği', { service: 'AuthService' }, { email, ip });

    // 1. Engellenmiş mi kontrol et
    const blockStatus = await this.bruteForce.isBlocked(ip, email);
    if (blockStatus.blocked) {
      const minutes = Math.ceil((blockStatus.ttl ?? 900) / 60);
      throw new HttpException(
        {
          error: {
            code:    'TOO_MANY_ATTEMPTS',
            message: `Çok fazla başarısız deneme. ${minutes} dakika bekleyin.`,
            ttl:     blockStatus.ttl,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Kullanıcıyı bul
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), is_active: true },
      select: ['id', 'email', 'password_hash', 'role', 'company_id', 'language', 'full_name'],
    });

    if (!user) {
      this.logger.warn('Login: Kullanıcı bulunamadı veya pasif', { service: 'AuthService' }, { email });
      await this.bruteForce.recordFailedAttempt(ip, email);
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    if (!user.password_hash) {
      this.logger.warn('Login: Kullanıcının şifresi yok', { service: 'AuthService' }, { email });
      await this.bruteForce.recordFailedAttempt(ip, email);
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // 3. Şifreyi kontrol et
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    this.logger.debug('Şifre kontrolü sonucu', { service: 'AuthService' }, { isPasswordValid });

    if (!isPasswordValid) {
      const attempt = await this.bruteForce.recordFailedAttempt(ip, email);

      if (attempt.blocked) {
        const minutes = Math.ceil((attempt.ttl ?? 900) / 60);
        this.logger.warn('Kullanıcı engellendi', { service: 'AuthService' }, {
          email, ip, attempts: attempt.attempts
        });
        throw new HttpException(
          {
            error: {
              code:    'TOO_MANY_ATTEMPTS',
              message: `Çok fazla başarısız deneme. ${minutes} dakika bekleyin.`,
              ttl:     attempt.ttl,
            },
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const remaining = 5 - attempt.attempts;
      throw new UnauthorizedException(
        remaining > 0
          ? `E-posta veya şifre hatalı. ${remaining} hakkınız kaldı.`
          : 'E-posta veya şifre hatalı.'
      );
    }

    // 4. Başarılı giriş — sayacı sıfırla
    await this.bruteForce.recordSuccess(ip, email);

    this.logger.info('Başarılı giriş', { service: 'AuthService' }, {
      userId: user.id, email, role: user.role
    });

    // Update last_login_at
    await this.userRepository.update(user.id, { last_login_at: new Date() });

    return this.generateTokens(user);
  }


  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret-key'),
      });
    } catch (e) {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Refresh token süresi dolmuş veya geçersiz.',
      });
    }

    const userId = payload.sub;
    const storedToken = await this.redisClient.get(`refresh:${userId}`);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz refresh token.',
      });
    }

    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Kullanıcı bulunamadı veya pasif.',
      });
    }

    const access_token = this.jwtService.sign(
      { sub: user.id, company_id: user.company_id, role: user.role },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'default-secret-key'),
        expiresIn: '15m',
      },
    );

    return { access_token };
  }

  async logout(userId: string) {
    await this.redisClient.del(`refresh:${userId}`);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email, is_active: true } });
    if (!user) {
      // Enumeration prevention: return 200 regardless of user existence
      return;
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const invitation = this.invitationRepository.create({
      user_id: user.id,
      company_id: user.company_id,
      token,
      type: 'password_reset',
      expires_at: expiresAt,
    });

    await this.invitationRepository.save(invitation);

    await this.notificationService.sendPasswordReset(
      user.email,
      user.full_name || user.email.split('@')[0],
      token,
      user.language || 'tr',
    );
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        type: 'password_reset',
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!invitation || !invitation.user_id) {
      throw new UnprocessableEntityException({
        code: 'INVITATION_EXPIRED',
        message: 'Geçersiz veya süresi dolmuş token.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(invitation.user_id, {
      password_hash: passwordHash,
    });

    invitation.used_at = new Date();
    await this.invitationRepository.save(invitation);

    // Invalidate all sessions
    await this.redisClient.del(`refresh:${invitation.user_id}`);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const { token, password } = dto;

    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!invitation || !invitation.user_id || !['hr_invite', 'employee_invite', 'consultant_invite'].includes(invitation.type)) {
      throw new UnprocessableEntityException({
        code: 'INVITATION_EXPIRED',
        message: 'Geçersiz veya süresi dolmuş davet.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await this.userRepository.update(invitation.user_id, {
      password_hash: passwordHash,
      is_active: true,
    });

    invitation.used_at = new Date();
    await this.invitationRepository.save(invitation);

    const user = await this.userRepository.findOne({ where: { id: invitation.user_id } });
    if (!user) {
      throw new UnprocessableEntityException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı.',
      });
    }
    
    // Auto-login
    return this.generateTokens(user);
  }

  async verifyInvite(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        used_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });

    if (!invitation) {
      throw new UnprocessableEntityException({
        code: 'INVITATION_EXPIRED',
        message: 'Geçersiz veya süresi dolmuş davet.',
      });
    }

    return { success: true, type: invitation.type };
  }

  async changePassword(userId: string, dto: any) {
    const { current_password, new_password } = dto;

    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
      select: ['id', 'email', 'password_hash', 'company_id', 'full_name'],
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Kullanıcı bulunamadı.',
      });
    }

    const isPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Mevcut şifre hatalı.',
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 12);
    await this.userRepository.update(userId, {
      password_hash: passwordHash,
    });

    // Revoke all refresh tokens
    await this.redisClient.del(`refresh:${userId}`);

    // Audit log
    await this.auditService.log({
      userId: userId,
      companyId: user.company_id,
      action: 'auth.password_change',
      targetId: userId,
      ipAddress: '0.0.0.0',
    });

    return { success: true };
  }

  async updateLanguage(userId: string, language: string) {
    await this.userRepository.update(userId, { language });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['consultant', 'company'],
    });

    if (!user) {
      throw new UnprocessableEntityException('Kullanıcı bulunamadı');
    }

    // Hassas bilgileri sil
    delete user.password_hash;
    
    return user;
  }

  async updateMe(userId: string, dto: any) {
    const { full_name, phone, language } = dto;
    
    await this.userRepository.update(userId, {
      full_name,
      language: language || 'tr'
    });

    return { success: true };
  }

  private async generateTokens(user: User) {
    let consultant_id = null;
    
    // If hr_admin, we need to get the company's consultant_id
    if (user.role === 'hr_admin' && user.company_id) {
      const company = await this.userRepository.manager.query(
        'SELECT consultant_id FROM companies WHERE id = $1',
        [user.company_id]
      );
      consultant_id = company[0]?.consultant_id;
    } else if (user.role === 'consultant') {
      consultant_id = user.id;
    }

    const payload = { 
      sub: user.id, 
      company_id: user.company_id, 
      role: user.role,
      consultant_id 
    };
    
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET', 'default-secret-key'),
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'default-refresh-secret-key'),
      expiresIn: '7d',
    });

    await this.redisClient.set(
      `refresh:${user.id}`,
      refresh_token,
      'EX',
      7 * 24 * 60 * 60, // 7 days in seconds
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        role: user.role,
        company_id: user.company_id,
        language: user.language,
        full_name: user.full_name,
        email: user.email,
      },
    };
  }
}
