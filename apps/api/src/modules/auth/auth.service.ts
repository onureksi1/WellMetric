import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
 
import { User } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { Invitation } from './entities/invitation.entity';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { NotificationService } from '../notification/notification.service';

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
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const loginAttemptsKey = `login_attempts:${email}`;
    const blockKey = `login_blocked:${email}`;

    // Check if blocked
    const isBlocked = await this.redisClient.get(blockKey);
    if (isBlocked) {
      throw new UnauthorizedException({
        code: 'FORBIDDEN',
        message: 'Çok fazla hatalı giriş denemesi. Lütfen 15 dakika bekleyin.',
      });
    }

    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
      select: ['id', 'email', 'password_hash', 'role', 'company_id', 'language', 'full_name'],
    });

    if (!user || !user.password_hash) {
      await this.handleFailedLogin(loginAttemptsKey, blockKey);
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz email veya şifre.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(loginAttemptsKey, blockKey);
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Geçersiz email veya şifre.',
      });
    }

    // Reset login attempts on success
    await this.redisClient.del(loginAttemptsKey);

    // Update last_login_at
    await this.userRepository.update(user.id, { last_login_at: new Date() });

    return this.generateTokens(user);
  }

  private async handleFailedLogin(attemptsKey: string, blockKey: string) {
    const attempts = await this.redisClient.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisClient.expire(attemptsKey, 60 * 15); // expire in 15 mins
    }
    if (attempts >= 5) {
      await this.redisClient.set(blockKey, '1', 'EX', 60 * 15); // block for 15 mins
    }
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
