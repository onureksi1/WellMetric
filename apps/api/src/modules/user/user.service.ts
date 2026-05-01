import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, MoreThan, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { PlatformUserFilterDto, UserRole } from './dto/platform-user-filter.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { AssignCompanyDto } from './dto/assign-company.dto';
import { Invitation } from '../auth/entities/invitation.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { Company } from '../company/entities/company.entity';
import { Department } from '../department/entities/department.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { SurveyThrottle } from '../response/entities/survey-throttle.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { UploadService } from '../upload/upload.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../upload/dto/presigned-url.dto';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  private s3Client: S3Client;
  private redisClient: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(SurveyToken)
    private readonly surveyTokenRepository: Repository<SurveyToken>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(SurveyAssignment)
    private readonly assignmentRepository: Repository<SurveyAssignment>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    @InjectRepository(SurveyThrottle)
    private readonly throttleRepository: Repository<SurveyThrottle>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION')!,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async findAll(companyId: string, filters: UserFilterDto) {
    try {
      const {
        department_id,
        is_active,
        role,
        seniority,
        location,
        search,
        status,
        page = 1,
        per_page = 50,
      } = filters;

      const query = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.department', 'department')
        .where('user.company_id = :companyId', { companyId });

      if (department_id) {
        query.andWhere('user.department_id = :department_id', { department_id });
      }
      if (is_active !== undefined) {
        query.andWhere('user.is_active = :is_active', { is_active });
      }
      if (role) {
        query.andWhere('user.role = :role', { role });
      }
      if (seniority) {
        query.andWhere('user.seniority = :seniority', { seniority });
      }
      if (location) {
        query.andWhere('user.location ILIKE :location', { location: `%${location}%` });
      }
      if (search) {
        query.andWhere('(user.full_name ILIKE :search OR user.email ILIKE :search)', { search: `%${search}%` });
      }
      if (status) {
        if (status === 'active') query.andWhere('user.is_active = true');
        else if (status === 'inactive') query.andWhere('user.is_active = false');
      }

      const [users, total] = await query
        .skip((page - 1) * per_page)
        .take(per_page)
        .orderBy('user.created_at', 'DESC')
        .getManyAndCount();

      if (users.length === 0) {
        return {
          data: [],
          meta: {
            total,
            page,
            per_page,
            last_page: Math.ceil(total / per_page),
          },
        };
      }

      const userIds = users.map(u => u.id);
      
      const invitations = await this.invitationRepository.find({
        where: { user_id: In(userIds), used_at: IsNull() },
      });
      const invMap = new Map(invitations.map(i => [i.user_id, i]));

      const responses = await this.responseRepository
        .createQueryBuilder('res')
        .select('res.user_id', 'user_id')
        .addSelect('COUNT(res.id)', 'count')
        .where('res.user_id IN (:...userIds)', { userIds })
        .groupBy('res.user_id')
        .getRawMany();
      const resMap = new Map(responses.map(r => [r.user_id, parseInt(r.count)]));

      const enrichedUsers = users.map(u => ({
        ...u,
        invitation_status: invMap.has(u.id) ? 'pending' : (u.last_login_at ? 'accepted' : 'none'),
        completed_surveys: resMap.get(u.id) || 0,
      }));

      return {
        data: enrichedUsers,
        meta: {
          total,
          page,
          per_page,
          total_pages: Math.ceil(total / per_page),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string, companyId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id, company_id: companyId },
        relations: ['department'],
      });
      if (!user) throw new NotFoundException('Çalışan bulunamadı.');
      return user;
    } catch (error) {
      throw error;
    }
  }

  async inviteSingle(companyId: string, dto: InviteUserDto, adminId: string) {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (!company) throw new NotFoundException('Şirket bulunamadı.');

      if (!company.settings.employee_accounts) {
        throw new BadRequestException({
          code: 'MODE_MISMATCH',
          message: 'Bu şirket Token Modunda çalışıyor. Lütfen toplu davet kullanın.',
        });
      }

      let user = await this.userRepository.findOne({ where: { email: dto.email, company_id: companyId } });
      
      if (user) {
        if (user.is_active) {
          throw new BadRequestException({
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Bu email adresiyle aktif bir kullanıcı zaten mevcut.',
          });
        }
        // Reactivate
        Object.assign(user, dto);
        user.is_active = true;
      } else {
        user = this.userRepository.create({
          ...dto,
          company_id: companyId,
          role: 'employee',
        });
      }

      const savedUser = await this.userRepository.save(user);

      // Create invitation
      const token = uuidv4();
      const invitation = this.invitationRepository.create({
        user_id: savedUser.id,
        company_id: companyId,
        token,
        type: 'employee_invite',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      });
      await this.invitationRepository.save(invitation);

      // Send notification
      await this.notificationService.sendEmployeeInvite(
        savedUser.email,
        savedUser.full_name || savedUser.email.split('@')[0],
        company.name,
        `${process.env.NEXT_PUBLIC_APP_URL}auth/accept-invite?token=${token}`,
        savedUser.language || 'tr'
      );

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.invite',
        'user',
        savedUser.id,
        { email: dto.email },
      );

      return savedUser;
    } catch (error) {
      throw error;
    }
  }

  async inviteBulk(companyId: string, s3Key: string, adminId: string) {
    try {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (!company) throw new NotFoundException('Şirket bulunamadı.');

      const bucket = this.configService.get('AWS_S3_BUCKET');
      const response = await this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: s3Key }));
      const csvData = await response.Body?.transformToString();
      if (!csvData) throw new BadRequestException('CSV dosyası okunamadı.');

      const records = parse(csvData, { columns: true, skip_empty_lines: true });
      const departments = await this.departmentRepository.find({ where: { company_id: companyId, is_active: true } });
      const deptMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));

      let success_count = 0;
      let error_count = 0;
      const errors = [];

      // Find active assignment for Token Mode
      let activeAssignment = null;
      if (!company.settings.employee_accounts) {
        activeAssignment = await this.assignmentRepository.findOne({
          where: { company_id: companyId, status: 'active' },
          order: { assigned_at: 'DESC' },
        });
      }

      for (let i = 0; i < records.length; i++) {
        const row = records[i] as any;
        const email = row.email?.trim().toLowerCase();
        
        try {
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Geçersiz email formatı.');
          }

          const deptName = row.department_name?.trim().toLowerCase();
          const department_id = deptMap.get(deptName);
          if (deptName && !department_id) {
            throw new Error(`Departman bulunamadı: ${row.department_name}`);
          }

          const userData = {
            full_name: row.full_name || email.split('@')[0],
            department_id: department_id || null,
            position: row.position || null,
            location: row.location || null,
            seniority: row.seniority || null,
            age_group: row.age_group || null,
            gender: row.gender || null,
            start_date: row.start_date || null,
            language: row.language || 'tr',
          };

          if (company.settings.employee_accounts) {
            // Account Mode
            let user = await this.userRepository.findOne({ where: { email, company_id: companyId } });
            if (user) {
              Object.assign(user, userData);
              user.is_active = true;
            } else {
              user = this.userRepository.create({
                ...userData,
                email,
                company_id: companyId,
                role: 'employee',
              });
            }
            const savedUser = await this.userRepository.save(user);

            const token = uuidv4();
            await this.invitationRepository.save({
              user_id: savedUser.id,
              company_id: companyId,
              token,
              type: 'employee_invite',
              expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
            });

            await this.notificationService.sendEmployeeInvite(
              email,
              userData.full_name,
              company.name,
              `${process.env.NEXT_PUBLIC_APP_URL}auth/accept-invite?token=${token}`,
              userData.language || 'tr'
            );
          } else {
            // Token Mode
            if (activeAssignment) {
              const token = uuidv4();
              await this.surveyTokenRepository.save({
                ...userData,
                email,
                company_id: companyId,
                survey_id: activeAssignment.survey_id,
                assignment_id: activeAssignment.id,
                token,
                expires_at: activeAssignment.due_at,
              });

              await this.notificationService.sendSurveyTokenInvite(
                email,
                userData.full_name,
                company.name,
                'Wellbeing Anketi', // Ideally fetch from activeAssignment.survey
                token,
                activeAssignment.due_at,
                userData.language || 'tr'
              );
            } else {
              // No active assignment, but still save to users for future surveys? 
              // The prompt says "users tablosuna kayıt AÇILMAZ" for Token Mode.
              // So we only create survey_token if assignment exists.
              // If no assignment, we might want to record the error or just skip.
              throw new Error('Aktif anket ataması bulunamadı.');
            }
          }
          success_count++;
        } catch (err) {
          error_count++;
          errors.push({ row: i + 1, email: email || 'N/A', reason: err.message });
        }
      }

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.bulk_invite',
        'user',
        undefined,
        { success_count, error_count, s3Key },
      );

      return { success_count, error_count, errors };
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id: string, companyId: string, dto: UpdateUserDto, adminId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id, company_id: companyId } });
      if (!user) throw new NotFoundException('Çalışan bulunamadı.');

      const oldData = { ...user };
      Object.assign(user, dto);
      const updated = await this.userRepository.save(user);

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.update',
        'user',
        id,
        { changes: dto },
      );

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(id: string, companyId: string, is_active: boolean, adminId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id, company_id: companyId } });
      if (!user) throw new NotFoundException('Çalışan bulunamadı.');

      user.is_active = is_active;
      await this.userRepository.save(user);

      if (!is_active) {
        // Cancel invitations
        await this.invitationRepository.update(
          { user_id: id, used_at: IsNull() },
          { used_at: new Date() },
        );
      }

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.status_change',
        'user',
        id,
        { is_active },
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async resendInvite(id: string, companyId: string, adminId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id, company_id: companyId } });
      if (!user) throw new NotFoundException('Çalışan bulunamadı.');

      const company = await this.companyRepository.findOne({ where: { id: companyId } });

      // Cancel old invitations
      await this.invitationRepository.update(
        { user_id: id, used_at: IsNull() },
        { used_at: new Date() },
      );

      const token = uuidv4();
      await this.invitationRepository.save({
        user_id: id,
        company_id: companyId,
        token,
        type: 'employee_invite',
        expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
      });

      await this.notificationService.sendEmployeeInvite(
        user.email,
        user.full_name,
        company?.name || 'Wellbeing Metric',
        `${process.env.NEXT_PUBLIC_APP_URL}auth/accept-invite?token=${token}`,
        user.language || 'tr'
      );

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.resend_invite',
        'user',
        id,
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getPresignedCsvUrl(companyId: string) {
    return this.uploadService.getPresignedPutUrl({
      company_id: companyId,
      file_type: FileType.CSV,
      mime_type: 'text/csv',
      file_size: 1024 * 1024,
    }, companyId);
  }

  async softDelete(id: string, companyId: string, adminId: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id, company_id: companyId } });
      if (!user) throw new NotFoundException('Çalışan bulunamadı.');

      user.is_active = false;
      await this.userRepository.save(user);

      // Cancel all active invitations
      await this.invitationRepository.update(
        { user_id: id, used_at: IsNull() },
        { used_at: new Date() },
      );

      await this.auditService.logAction(
        adminId,
        companyId,
        'user.delete',
        'user',
        id,
      );

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // ── Platform Admin Methods ──────────────────────────────────────────

  async findAllPlatform(filters: PlatformUserFilterDto, requestingUser: any) {
    const { company_id: filterCompanyId, role, is_active, search, page = 1, per_page = 50 } = filters;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.role != :superAdmin', { superAdmin: 'super_admin' });

    // Role-based automatic filtering
    if (requestingUser.role === 'hr_admin') {
      query.andWhere('user.company_id = :cid', { cid: requestingUser.company_id });
    } else if (requestingUser.role === 'consultant') {
      query.andWhere('company.consultant_id = :cid', { cid: requestingUser.id });
    }

    // Manual filters
    if (filterCompanyId) {
      query.andWhere('user.company_id = :company_id', { company_id: filterCompanyId });
    }
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (is_active !== undefined) {
      query.andWhere('user.is_active = :is_active', { is_active });
    }
    if (search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.full_name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await query
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * per_page)
      .take(per_page)
      .getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async getPlatformStats() {
    const cacheKey = 'admin:user:stats';
    
    // Total users excluding super_admin
    const total = await this.userRepository.count({ 
      where: { role: Not('super_admin') } 
    });
    
    const active = await this.userRepository.count({ 
      where: { role: Not('super_admin'), is_active: true } 
    });
    
    const inactive = total - active;
    
    // Pending invite: password_hash is null and is_active is true
    const pending_invite = await this.userRepository.count({
      where: { 
        role: Not('super_admin'), 
        password_hash: IsNull(), 
        is_active: true 
      }
    });

    const hr_admin = await this.userRepository.count({ where: { role: 'hr_admin' } });
    const employee = await this.userRepository.count({ where: { role: 'employee' } });
    const consultant = await this.userRepository.count({ where: { role: 'consultant' } });

    const tr = await this.userRepository.count({ where: { language: 'tr', role: Not('super_admin') } });
    const en = await this.userRepository.count({ where: { language: 'en', role: Not('super_admin') } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const new_this_month = await this.userRepository.count({
      where: { created_at: MoreThan(startOfMonth), role: Not('super_admin') }
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const login_last_30_days = await this.userRepository.count({
      where: { last_login_at: MoreThan(thirtyDaysAgo), role: Not('super_admin') }
    });

    const stats = {
      total,
      active,
      inactive,
      pending_invite,
      by_role: { hr_admin, employee, consultant },
      by_language: { tr, en },
      new_this_month,
      login_last_30_days,
    };

    // Cache with a shorter duration for admin responsiveness
    await this.redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 60); 
    return stats;
  }

  async findOnePlatform(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company', 'department'],
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const survey_responses = await this.responseRepository.find({
      where: { user_id: id },
      order: { submitted_at: 'DESC' },
      take: 5,
    });

    const audit_logs = await this.auditService.findAll({
      user_id: id,
      page: 1,
      per_page: 10,
    });

    return {
      ...user,
      survey_responses,
      audit_logs: audit_logs.items,
    };
  }

  async createPlatformUser(dto: CreatePlatformUserDto, createdBy: string) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Bu e-posta adresi zaten kullanımda.',
      });
    }

    const company = await this.companyRepository.findOne({ where: { id: dto.company_id } });
    if (!company) throw new NotFoundException('Firma bulunamadı.');

    if (dto.department_id) {
      const dept = await this.departmentRepository.findOne({
        where: { id: dto.department_id, company_id: dto.company_id }
      });
      if (!dept) throw new BadRequestException('Departman bu firmaya ait değil.');
    }

    const user = this.userRepository.create({
      ...dto,
      password_hash: null,
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    const token = uuidv4();
    const type = dto.role === UserRole.HR_ADMIN ? 'hr_invite' : 'employee_invite';
    
    await this.invitationRepository.save({
      user_id: savedUser.id,
      company_id: dto.company_id,
      token,
      type,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
    });

    if (dto.role === UserRole.HR_ADMIN) {
      await this.notificationService.sendWelcomeHr(
        savedUser.email,
        savedUser.full_name || 'Admin',
        company.name,
        `${process.env.NEXT_PUBLIC_APP_URL}auth/accept-invite?token=${token}`,
        savedUser.language || 'tr'
      );
    } else {
      await this.notificationService.sendEmployeeInvite(
        savedUser.email,
        savedUser.full_name || 'Kullanıcı',
        company.name,
        token,
        savedUser.language || 'tr'
      );
    }

    await this.auditService.logAction(
      createdBy,
      dto.company_id,
      'user.admin_create',
      'user',
      savedUser.id,
      { dto }
    );

    return savedUser;
  }

  async updatePlatformUser(id: string, dto: UpdatePlatformUserDto, updatedBy: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const { full_name, role, language, department_id, seniority, location, start_date } = dto;
    
    if (department_id) {
      const dept = await this.departmentRepository.findOne({
        where: { id: department_id, company_id: user.company_id! }
      });
      if (!dept) throw new BadRequestException('Departman bu firmaya ait değil.');
    }

    Object.assign(user, { full_name, role, language, department_id, seniority, location, start_date });
    const updated = await this.userRepository.save(user);

    await this.auditService.logAction(
      updatedBy,
      user.company_id,
      'user.admin_update',
      'user',
      id,
      { dto }
    );

    return updated;
  }

  async assignCompany(id: string, dto: AssignCompanyDto, updatedBy: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const from_company = user.company_id;
    const to_company = dto.company_id;

    const company = await this.companyRepository.findOne({ where: { id: to_company } });
    if (!company) throw new NotFoundException('Firma bulunamadı.');

    if (dto.department_id) {
      const dept = await this.departmentRepository.findOne({
        where: { id: dto.department_id, company_id: to_company }
      });
      if (!dept) throw new BadRequestException('Departman bu firmaya ait değil.');
    }

    // Cancel old invitations
    await this.invitationRepository.update(
      { user_id: id, used_at: IsNull() },
      { used_at: new Date() }
    );

    // Update user
    user.company_id = to_company;
    user.department_id = dto.department_id || null;
    await this.userRepository.save(user);

    // Clear survey throttle for old company
    await this.throttleRepository.delete({ user_id: id });

    await this.auditService.logAction(
      updatedBy,
      to_company,
      'user.company_assigned',
      'user',
      id,
      { from_company, to_company }
    );

    return user;
  }

  async updatePlatformStatus(id: string, is_active: boolean, updatedBy: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    user.is_active = is_active;
    await this.userRepository.save(user);

    await this.auditService.logAction(
      updatedBy,
      user.company_id,
      'user.status_change',
      'user',
      id,
      { is_active }
    );

    return { success: true };
  }

  async resendPlatformInvite(id: string, sentBy: string) {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['company'] });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    if (user.password_hash) {
      throw new BadRequestException('Bu kullanıcı zaten kaydını tamamlamış.');
    }

    // Cancel old invitations
    await this.invitationRepository.update(
      { user_id: id, used_at: IsNull() },
      { used_at: new Date() }
    );

    const token = uuidv4();
    const type = user.role === 'hr_admin' ? 'hr_invite' : (user.role === 'consultant' ? 'consultant_invite' : 'employee_invite');

    await this.invitationRepository.save({
      user_id: id,
      company_id: user.company_id,
      token,
      type,
      expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000),
    });

    console.log(`[ResendInvite] Token created for ${user.email}: ${token}`);

    if (user.role === 'hr_admin') {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}auth/accept-invite?token=${token}`;
      await this.notificationService.sendWelcomeHr(
        user.email,
        user.full_name || 'Admin',
        user.company?.name || 'Firma',
        inviteUrl,
        user.language || 'tr'
      );
    } else if (user.role === 'consultant') {
      await this.notificationService.sendConsultantWelcome(
        user.email,
        user.full_name || 'Eğitmen',
        token,
        user.language || 'tr'
      );
    } else {
      await this.notificationService.sendEmployeeInvite(
        user.email,
        user.full_name || 'Kullanıcı',
        user.company?.name || 'Firma',
        token,
        user.language || 'tr'
      );
    }

    console.log(`[ResendInvite] Mail sent to: ${user.email}`);

    await this.auditService.logAction(
      sentBy,
      user.company_id,
      'user.resend_invite',
      'user',
      id
    );

    return { success: true };
  }

  async deletePlatformUser(id: string, deletedBy: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    const companyId = user.company_id;

    // Delete associated records first (invitations, etc)
    await this.invitationRepository.delete({ user_id: id });
    
    // Hard delete
    await this.userRepository.delete(id);

    await this.auditService.logAction(
      deletedBy,
      companyId,
      'user.admin_hard_delete',
      'user',
      id
    );

    return { success: true };
  }
}
