import { Injectable, NotFoundException, UnprocessableEntityException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { Company } from './entities/company.entity';
import { Invitation } from '../auth/entities/invitation.entity';
import * as crypto from 'crypto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CompanyFilterDto } from './dto/company-filter.dto';
import { AuditService } from '../audit/audit.service';
import { IndustryService } from '../industry/industry.service';
import { NotificationService } from '../notification/notification.service';
import { SettingsService } from '../settings/settings.service';
import { DepartmentService } from '../department/department.service';
import { SurveyService } from '../survey/survey.service';
import { AIService } from '../ai/ai.service';

function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}


@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly industryService: IndustryService,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
    private readonly departmentService: DepartmentService,
    @Inject(forwardRef(() => SurveyService))
    private readonly surveyService: SurveyService,
    @Inject(forwardRef(() => AIService))
    private readonly aiService: AIService,
  ) {}

  async findAll(filters: CompanyFilterDto, requestingUser: any) {
    const { plan, is_active, industry, search, consultant_id: filterConsultantId, page = 1, per_page = 50 } = filters;
    
    // We use raw SQL with subqueries for surgical precision and performance
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    // consultant sadece kendi firmalarını görür
    if (requestingUser.role === 'consultant') {
      params.push(requestingUser.id);
      paramCount++;
      whereClause += ` AND c.consultant_id = $${paramCount}`;
    } else if (filterConsultantId) {
      // super_admin belirli bir consultant'a göre filtreleyebilir
      params.push(filterConsultantId);
      paramCount++;
      whereClause += ` AND c.consultant_id = $${paramCount}`;
    }

    if (plan) {
      params.push(plan.toLowerCase());
      paramCount++;
      whereClause += ` AND LOWER(c.plan) = $${paramCount}`;
    }
    if (is_active !== undefined) {
      params.push(is_active);
      paramCount++;
      whereClause += ` AND c.is_active = $${paramCount}`;
    }
    if (industry) {
      params.push(`%${industry}%`);
      paramCount++;
      whereClause += ` AND c.industry ILIKE $${paramCount}`;
    }
    if (search) {
      params.push(`%${search}%`);
      paramCount++;
      whereClause += ` AND (c.name ILIKE $${paramCount} OR c.contact_email ILIKE $${paramCount})`;
    }

    const offset = (page - 1) * per_page;
    paramCount++;
    const limitIdx = paramCount;
    paramCount++;
    const offsetIdx = paramCount;
    
    params.push(per_page, offset);

    const query = `
      SELECT c.*, 
        i.label_tr as industry_label_tr,
        i.label_en as industry_label_en,
        (SELECT COUNT(*)::int FROM users u WHERE u.company_id = c.id AND u.is_active = true) as users_count,
        (SELECT COUNT(*)::int FROM users u WHERE u.company_id = c.id AND u.is_active = true AND u.role = 'hr_admin') as hr_admin_count,
        (SELECT COUNT(*)::int FROM employees e WHERE e.company_id = c.id AND e.is_active = true) as employee_count,
        (SELECT MAX(ends_at) FROM surveys s WHERE s.company_id = c.id) as last_survey_date,
        (SELECT score::float FROM wellbeing_scores w WHERE w.company_id = c.id AND w.dimension = 'overall' ORDER BY calculated_at DESC LIMIT 1) as general_wellbeing_score,
        (SELECT email FROM users u2 WHERE u2.company_id = c.id AND u2.role = 'hr_admin' LIMIT 1) as hr_admin_email
      FROM companies c
      LEFT JOIN industries i ON c.industry = i.slug
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const items = await this.dataSource.query(query, params);
    
    const countQuery = `SELECT COUNT(*)::int as total FROM companies c ${whereClause}`;
    const countRes = await this.dataSource.query(countQuery, params.slice(0, -2));
    const total = countRes[0]?.total || 0;

    return {
      data: items,
      items, // for compatibility
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async findOne(id: string, requestingUser?: any) {
    let whereClause = 'WHERE c.id = $1';
    const params: any[] = [id];

    if (requestingUser?.role === 'consultant') {
      whereClause += ' AND c.consultant_id = $2';
      params.push(requestingUser.id);
    }

    const companyRaw = await this.dataSource.query(`
      SELECT c.*, i.label_tr as industry_label_tr, i.label_en as industry_label_en
      FROM companies c
      LEFT JOIN industries i ON c.industry = i.slug
      ${whereClause}
    `, params);

    if (companyRaw.length === 0) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Firma bulunamadı.' });
    const company = companyRaw[0];

    const departments = await this.dataSource.query(`SELECT id, name, is_active FROM departments WHERE company_id = $1`, [id]);
    const hrAdmins = await this.dataSource.query(`SELECT id, full_name, email, is_active FROM users WHERE company_id = $1 AND role = 'hr_admin'`, [id]);
    const assignments = await this.dataSource.query(`
      SELECT sa.id, sa.assigned_at, sa.due_at, sa.status, sa.period, s.title_tr, 'assignment' as source
      FROM survey_assignments sa 
      JOIN surveys s ON sa.survey_id = s.id 
      WHERE sa.company_id = $1
      UNION ALL
      SELECT s.id, s.created_at, NULL, 'active', NULL, s.title_tr, 'direct' as source
      FROM surveys s
      WHERE s.company_id = $1 AND s.is_active = true
        AND s.id NOT IN (SELECT survey_id FROM survey_assignments WHERE company_id = $1)
      ORDER BY assigned_at DESC LIMIT 10
    `, [id]);
    
    const scores = await this.dataSource.query(`
      SELECT dimension, score FROM wellbeing_scores 
      WHERE company_id = $1 
      AND (dimension = 'overall' OR dimension = 'mental' OR dimension = 'physical')
      AND calculated_at = (SELECT MAX(calculated_at) FROM wellbeing_scores WHERE company_id = $1)
    `, [id]);

    const chartData = await this.dataSource.query(`
      SELECT period, score FROM wellbeing_scores 
      WHERE company_id = $1 AND dimension = 'overall' 
      ORDER BY period DESC LIMIT 12
    `, [id]);

    const insight = await this.dataSource.query(`
      SELECT content, generated_at FROM ai_insights 
      WHERE company_id = $1 AND insight_type = 'trend_analysis'
      ORDER BY generated_at DESC LIMIT 1
    `, [id]);

    return {
      company,
      departments,
      hr_admins: hrAdmins,
      assigned_surveys: assignments,
      wellbeing_chart: chartData.reverse(),
      scores: scores.reduce((acc: any, s: any) => ({ ...acc, [s.dimension]: s.score }), {}),
      last_ai_insight: insight[0] || null,
    };
  }

  async create(dto: CreateCompanyDto, adminUserId?: string) {
    return this.dataSource.transaction(async (manager) => {
      // 0. Email check
      const existingUser = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.hr_admin_email]);
      if (existingUser.length > 0) {
        throw new UnprocessableEntityException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Bu HR yetkilisi emaili sistemde zaten kayıtlı.',
        });
      }

      // 1. Industry validation
      if (dto.industry) {
        const industry = await this.industryService.findOneBySlug(dto.industry);
        if (!industry || !industry.is_active) {
          throw new UnprocessableEntityException({
            code: 'INVALID_INDUSTRY',
            message: 'Seçilen sektör geçerli değil veya pasif durumda.',
          });
        }
      }

      // 2. Slug unique check
      let slug = generateSlug(dto.name);
      const existingSlugCount = await manager.query(`SELECT COUNT(*) as count FROM companies WHERE slug LIKE $1`, [`${slug}%`]);
      const c = parseInt(existingSlugCount[0].count, 10);
      if (c > 0) {
        slug = `${slug}-${c + 1}`;
      }

      // Fetch creator role to auto-assign consultant_id if needed
      const creator = await manager.query(`SELECT role FROM users WHERE id = $1 LIMIT 1`, [adminUserId]);
      const creatorRole = creator[0]?.role;
      const autoConsultantId = creatorRole === 'consultant' ? adminUserId : (dto.consultant_id || null);

      // Create company
      const companyRes = await manager.query(`
        INSERT INTO companies (name, slug, industry, size_band, plan, contact_email, settings, created_by, consultant_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, slug
      `, [
        dto.name, slug, dto.industry || null, dto.size_band || null, dto.plan, dto.contact_email,
        JSON.stringify({
          employee_accounts: false,
          anonymity_threshold: 5,
          benchmark_visible: true,
          default_language: dto.default_language || 'tr',
        }),
        adminUserId || null,
        autoConsultantId
      ]);

      const companyId = companyRes[0].id;

      // Create HR Admin user with default password 'Hr123123!'
      const defaultPasswordHash = '$2a$10$MxghbAJS1lHYWR3X6WvwO.mPTwB/fYAIoRMTcv0IqsHu0fx56rHC.';
      const userRes = await manager.query(`
        INSERT INTO users (company_id, email, role, language, password_hash)
        VALUES ($1, $2, 'hr_admin', $3, $4) RETURNING id
      `, [companyId, dto.hr_admin_email, dto.default_language || 'tr', defaultPasswordHash]);

      const hrUserId = userRes[0].id;

      // 3. Create invitation
      const inviteToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await manager.query(`
        INSERT INTO invitations (user_id, company_id, token, type, expires_at)
        VALUES ($1, $2, $3, 'hr_invite', $4)
      `, [hrUserId, companyId, inviteToken, expiresAt]);
      console.log('[Company.create] Invitation created for HR User:', hrUserId);

      // Audit log
      await this.auditService.logAction(
        adminUserId || null,
        companyId,
        'company.create',
        'company',
        companyId,
        { name: dto.name, plan: dto.plan }
      );

      // 4. Emit to notification service for welcome_hr mail
      try {
        const settings = await this.settingsService.getSettings();
        console.log('[Company.create] Checking mail config...');
        
        if (!settings?.mail_provider || settings.mail_provider === 'none') {
          console.warn(`[Company.create] Mail provider not configured. Invitation email not sent for: ${dto.hr_admin_email}`);
        } else {
          const platformUrl = settings.platform_url || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const inviteLink = `${platformUrl}/invite?token=${inviteToken}`;
          
          console.log('[Company.create] Sending welcome email to:', dto.hr_admin_email);
          await this.notificationService.sendWelcomeHr(
            dto.hr_admin_email,
            dto.hr_admin_full_name || 'HR Yetkilisi',
            dto.name,
            inviteLink,
            dto.default_language || 'tr',
            companyId,
            dto.consultant_id || undefined
          );
          console.log('[Company.create] Notification service call completed.');
        }
      } catch (mailError) {
        console.error(`[Company.create] FAILED to queue invitation mail: ${mailError.message}`);
      }

      return { success: true, company: companyRes[0] };
    });
  }

  async update(id: string, dto: UpdateCompanyDto, requestingUser: any) {
    // Ownership check
    await this.findOne(id, requestingUser);
    
    const { name, plan, contact_email, industry, size_band } = dto;
    
    if (industry) {
      const industryEntity = await this.industryService.findOneBySlug(industry);
      if (!industryEntity || !industryEntity.is_active) {
        throw new UnprocessableEntityException({
          code: 'INVALID_INDUSTRY',
          message: 'Seçilen sektör geçerli değil veya pasif durumda.',
        });
      }
    }

    await this.dataSource.query(`
      UPDATE companies 
      SET 
        name = COALESCE($1, name),
        plan = COALESCE($2, plan),
        contact_email = COALESCE($3, contact_email),
        industry = COALESCE($4, industry),
        size_band = COALESCE($5, size_band)
      WHERE id = $6
    `, [name || null, plan || null, contact_email || null, industry || null, size_band || null, id]);

    await this.auditService.logAction(requestingUser.id || null, id, 'company.update', 'company', id, dto);

    return { success: true };
  }

  async updateStatus(id: string, is_active: boolean, requestingUser: any) {
    // Ownership check
    await this.findOne(id, requestingUser);

    return this.dataSource.transaction(async (manager) => {
      await manager.query(`UPDATE companies SET is_active = $1 WHERE id = $2`, [is_active, id]);

      if (!is_active) {
        // Cancel active survey assignments
        await manager.query(`UPDATE survey_assignments SET status = 'cancelled' WHERE company_id = $1 AND status = 'active'`, [id]);
        
        // Disable survey tokens
        await manager.query(`UPDATE survey_tokens SET is_used = true, used_at = NOW() WHERE company_id = $1 AND is_used = false`, [id]);
      }

      await this.auditService.logAction(requestingUser.id || null, id, 'company.status_change', 'company', id, { is_active });

      return { success: true };
    });
  }

  async updateSettings(id: string, dto: UpdateSettingsDto, requestingUser: any) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Firma bulunamadı.' });

    if (requestingUser.role === 'consultant' && company.consultant_id !== requestingUser.id) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Firma bulunamadı.' });
    }

      const currentSettings = (company.settings as any) || {};
      const newSettings = { ...currentSettings, ...dto };
  
      return this.dataSource.transaction(async (manager) => {
        await manager.query(`UPDATE companies SET settings = $1 WHERE id = $2`, [JSON.stringify(newSettings), id]);
  
        if ((currentSettings as any).employee_accounts !== dto.employee_accounts) {
        if (dto.employee_accounts === true) {
          // TODO: send info mail to HR Admin
        } else if (dto.employee_accounts === false) {
          // Cancel open employee_invite invitations
          await manager.query(`
            UPDATE invitations 
            SET used_at = NOW() 
            WHERE company_id = $1 AND type = 'employee_invite' AND used_at IS NULL AND expires_at > NOW()
          `, [id]);
        }
      }

      await this.auditService.logAction(requestingUser.id || null, id, 'company.settings.update', 'company', id, dto);

      return { success: true };
    });
  }

  async delete(id: string, requestingUser: any) {
    // Ownership check
    await this.findOne(id, requestingUser);

    return this.dataSource.transaction(async (manager) => {
      // 1. Check for active users
      const usersCount = await manager.query(`SELECT COUNT(*)::int as count FROM users WHERE company_id = $1 AND is_active = true`, [id]);
      const count = usersCount[0]?.count || 0;
      
      if (count > 0) {
        throw new UnprocessableEntityException({
          code: 'COMPANY_HAS_USERS',
          message: `Bu firmada ${count} aktif kullanıcı bulunduğu için silinemez. Önce kullanıcıları silmelisiniz.`,
          user_count: count
        });
      }

      // 2. Full Cleanup (Hard Delete related records)
      await manager.query(`DELETE FROM invitations WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM survey_tokens WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM survey_responses WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM survey_assignments WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM wellbeing_scores WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM ai_insights WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM departments WHERE company_id = $1`, [id]);
      await manager.query(`DELETE FROM users WHERE company_id = $1`, [id]);
      
      // 3. Final: Delete the company itself
      await manager.query(`DELETE FROM companies WHERE id = $1`, [id]);
      
      await this.auditService.logAction(requestingUser.id || null, id, 'company.hard_delete', 'company', id);

      return { success: true };
    });
  }

  async getStats(id: string, requestingUser?: any) {
    // Ownership check
    if (requestingUser) {
      await this.findOne(id, requestingUser);
    }
    const usersCount    = await this.dataSource.query(`SELECT COUNT(*) as count FROM users     WHERE company_id = $1 AND is_active = true`, [id]);
    const employeeCount = await this.dataSource.query(`SELECT COUNT(*) as count FROM employees WHERE company_id = $1 AND is_active = true`, [id]);
    const activeSurveys = await this.dataSource.query(`SELECT COUNT(*) as count FROM survey_assignments WHERE company_id = $1 AND status = 'active'`, [id]);
    
    const lastResponseRateRes = await this.dataSource.query(`
      SELECT (COUNT(sr.id)::float / NULLIF(COUNT(st.id), 0)) * 100 as rate 
      FROM survey_assignments sa
      JOIN survey_tokens st ON st.assignment_id = sa.id
      LEFT JOIN survey_responses sr ON sr.assignment_id = sa.id
      WHERE sa.company_id = $1
      GROUP BY sa.id ORDER BY sa.assigned_at DESC LIMIT 1
    `, [id]);

    const lastScore = await this.dataSource.query(`
      SELECT score FROM wellbeing_scores 
      WHERE company_id = $1 AND dimension = 'overall' 
      ORDER BY calculated_at DESC LIMIT 1
    `, [id]);

    const trend = await this.dataSource.query(`
      SELECT period, score FROM wellbeing_scores 
      WHERE company_id = $1 AND dimension = 'overall' 
      ORDER BY period DESC LIMIT 12
    `, [id]);

    return {
      users_count:        parseInt(usersCount[0]?.count    || '0', 10),
      employee_count:     parseInt(employeeCount[0]?.count || '0', 10),
      active_surveys: parseInt(activeSurveys[0]?.count || '0', 10),
      last_response_rate: parseFloat(lastResponseRateRes[0]?.rate || '0'),
      last_score: parseFloat(lastScore[0]?.score || '0'),
      trend: trend.reverse(),
    };
  }

  async getPresignedLogoUrl(id: string, fileType: string, mimeType: string) {
    // MOCK: Generates a presigned URL format for S3/Cloudflare R2
    // Normally this uses @aws-sdk/s3-request-presigner
    const token = uuidv4();
    const mockPresignedUrl = `https://storage.wellanalytics.io/logos/${id}/${token}.${fileType.split('/')[1] || 'png'}?X-Amz-Signature=mock_signature`;
    
    return {
      upload_url: mockPresignedUrl,
      file_path: `logos/${id}/${token}.${fileType.split('/')[1] || 'png'}`
    };
  }

  // ── Company User Management ──────────────────────────────────────────

  async getCompanyUsers(id: string, filters: any, user: any) {
    await this.findOne(id, user);
    const { search, role, is_active, department_id, page = 1, per_page = 50 } = filters;
    let whereClause = 'WHERE u.company_id = $1';
    const params: any[] = [id];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
    }
    if (role) {
      params.push(role);
      whereClause += ` AND u.role = $${params.length}`;
    }
    if (is_active !== undefined && is_active !== '') {
      params.push(is_active === 'true' || is_active === true);
      whereClause += ` AND u.is_active = $${params.length}`;
    }
    if (department_id) {
      params.push(department_id);
      whereClause += ` AND u.department_id = $${params.length}`;
    }

    const offset = (page - 1) * per_page;
    params.push(per_page, offset);

    const query = `
      SELECT u.id, u.full_name, u.email, u.role, u.is_active, u.last_login_at, u.created_at, u.language,
             u.password_hash,
             d.name as department_name,
             (SELECT i.used_at FROM invitations i WHERE i.user_id = u.id ORDER BY i.created_at DESC LIMIT 1) as invite_used_at,
             (SELECT i.expires_at FROM invitations i WHERE i.user_id = u.id ORDER BY i.created_at DESC LIMIT 1) as invite_expires_at
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const items = await this.dataSource.query(query, params);
    
    const countQuery = `SELECT COUNT(*)::int as total FROM users u ${whereClause}`;
    const countRes = await this.dataSource.query(countQuery, params.slice(0, -2));
    
    return {
      data: items,
      meta: {
        total: countRes[0]?.total || 0,
        page,
        per_page
      }
    };
  }

  async addCompanyUser(id: string, dto: any, user: any) {
    await this.findOne(id, user);
    return this.dataSource.transaction(async (manager) => {
      // Check if user already exists
      const existing = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.email]);
      if (existing.length > 0) {
        throw new UnprocessableEntityException({ code: 'USER_EXISTS', message: 'Bu e-posta adresi zaten kullanımda.' });
      }

      // Create user
      const userRes = await manager.query(`
        INSERT INTO users (company_id, email, full_name, role, department_id, language, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id
      `, [id, dto.email, dto.full_name, dto.role, dto.department_id || null, dto.language || 'tr']);
      
      const userId = userRes[0].id;

      // Create invitation
      const inviteToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await manager.query(`
        INSERT INTO invitations (user_id, company_id, token, type, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, id, inviteToken, dto.role === 'hr_admin' ? 'hr_invite' : 'employee_invite', expiresAt]);

      // Send email
      const company = await manager.query(`SELECT name, consultant_id FROM companies WHERE id = $1`, [id]);
      const companyName = company[0]?.name || 'Wellbeing Metric';
      const consultantId: string | undefined = company[0]?.consultant_id || undefined;

      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteLink = `${platformUrl}/invite?token=${inviteToken}`;

      if (dto.role === 'hr_admin') {
        await this.notificationService.sendWelcomeHr(dto.email, dto.full_name, companyName, inviteLink, dto.language || 'tr', id, consultantId);
      } else {
        await this.notificationService.sendEmployeeInvite(dto.email, dto.full_name, companyName, inviteLink, dto.language || 'tr', id, consultantId);
      }

      await this.auditService.logAction(user?.id || null, id, 'user.create', 'user', userId, { email: dto.email, role: dto.role });

      return { success: true, user_id: userId };
    });
  }

  async updateCompanyUser(id: string, userId: string, dto: any, user: any) {
    await this.findOne(id, user);
    const { full_name, department_id, role, is_active, language } = dto;
    
    await this.dataSource.query(`
      UPDATE users 
      SET 
        full_name = COALESCE($1, full_name),
        department_id = $2,
        role = COALESCE($3, role),
        is_active = COALESCE($4, is_active),
        language = COALESCE($5, language)
      WHERE id = $6 AND company_id = $7
    `, [full_name, department_id || null, role, is_active, language, userId, id]);

    await this.auditService.logAction(user?.id || null, id, 'user.update', 'user', userId, dto);
    return { success: true };
  }

  async toggleCompanyUserStatus(id: string, userId: string, isActive: boolean, user: any) {
    await this.findOne(id, user);
    await this.dataSource.query(`UPDATE users SET is_active = $1 WHERE id = $2 AND company_id = $3`, [isActive, userId, id]);
    await this.auditService.logAction(user?.id || null, id, 'user.status_toggle', 'user', userId, { is_active: isActive });
    return { success: true };
  }

  async deleteCompanyUser(id: string, userId: string, user: any) {
    await this.findOne(id, user);
    return this.dataSource.transaction(async (manager) => {
      // 1. Delete associated invitations first
      await manager.query(`DELETE FROM invitations WHERE user_id = $1`, [userId]);
      // 2. Hard delete the user
      await manager.query(`DELETE FROM users WHERE id = $1 AND company_id = $2`, [userId, id]);
      
      await this.auditService.logAction(user?.id || null, id, 'user.hard_delete', 'user', userId);
      return { success: true };
    });
  }

  async bulkDeleteCompanyUsers(id: string, userIds: string[], user: any) {
    await this.findOne(id, user);
    if (!userIds.length) return { success: true };
    
    await this.dataSource.query(`
      UPDATE users SET is_active = false 
      WHERE id = ANY($1) AND company_id = $2
    `, [userIds, id]);

    await this.auditService.logAction(user?.id || null, id, 'user.bulk_delete', 'user', null, { user_ids: userIds });
    return { success: true };
  }

  async resendCompanyUserInvite(id: string, userId: string, user: any) {
    await this.findOne(id, user);
    const userData = await this.dataSource.query(`SELECT id, email, full_name, role, language, password_hash FROM users WHERE id = $1 AND company_id = $2`, [userId, id]);
    if (user.length === 0) throw new NotFoundException('Kullanıcı bulunamadı.');
    
    if (user[0].password_hash) {
      throw new BadRequestException('Bu kullanıcı zaten şifresini belirlemiş, davet tekrar gönderilemez.');
    }

    return this.dataSource.transaction(async (manager) => {
      // Deactivate old invites
      await manager.query(`UPDATE invitations SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`, [userId]);

      const inviteToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await manager.query(`
        INSERT INTO invitations (user_id, company_id, token, type, expires_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, id, inviteToken, user[0].role === 'hr_admin' ? 'hr_invite' : 'employee_invite', expiresAt]);

      const company = await manager.query(`SELECT name FROM companies WHERE id = $1`, [id]);
      const companyName = company[0]?.name || 'Wellbeing Metric';
      
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteLink = `${platformUrl}/invite?token=${inviteToken}`;

      if (user[0].role === 'hr_admin') {
        await this.notificationService.sendWelcomeHr(user[0].email, user[0].full_name, companyName, inviteLink, user[0].language || 'tr');
      } else {
        await this.notificationService.sendEmployeeInvite(user[0].email, user[0].full_name, companyName, inviteLink, user[0].language || 'tr');
      }

      await this.auditService.logAction(user?.id || null, id, 'user.invite.resend', 'user', userId);
      return { success: true };
    });
  }

  async importCompanyUsers(id: string, users: any[], user: any) {
    await this.findOne(id, user);
    let successCount = 0;
    const errors: any[] = [];

    for (const [index, userData] of users.entries()) {
      try {
        await this.addCompanyUser(id, userData, user.id);
        successCount++;
      } catch (err: any) {
        errors.push({
          row: index + 1,
          email: userData.email,
          message: err.response?.message || err.message || 'Bilinmeyen hata'
        });
      }
    }

    await this.auditService.logAction(user.id, id, 'user.import', 'company', id, { success_count: successCount, error_count: errors.length });
    return { success: true, success_count: successCount, errors };
  }

  // ── Company Department Management ────────────────────────────────────

  async getCompanyDepartments(id: string, user: any) {
    await this.findOne(id, user);
    return this.departmentService.findAll(id);
  }

  async addCompanyDepartment(id: string, dto: any, user: any) {
    await this.findOne(id, user);
    return this.departmentService.create(id, dto, user.id);
  }

  async updateCompanyDepartment(id: string, deptId: string, dto: any, user: any) {
    await this.findOne(id, user);
    return this.departmentService.update(deptId, id, dto, user.id);
  }

  async deleteCompanyDepartment(id: string, deptId: string, user: any) {
    await this.findOne(id, user);
    return this.departmentService.delete(deptId, id, user.id);
  }

  async getCompanySurveys(id: string, user: any) {
    await this.findOne(id, user);
    return this.surveyService.getCompanySurveys(id);
  }
}
