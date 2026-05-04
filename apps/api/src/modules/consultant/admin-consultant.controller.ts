import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Patch, 
  Put,
  Delete, 
  UseGuards, 
  Query, 
  ParseUUIDPipe,
  ConflictException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull, MoreThan } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { ConsultantPlan } from './entities/consultant-plan.entity';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from '../notification/notification.service';
import { SettingsService } from '../settings/settings.service';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Controller('admin/consultants')
@Roles('super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminConsultantController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ConsultantPlan)
    private readonly planRepository: Repository<ConsultantPlan>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async findAll(@Query() filters: any) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;
    
    let whereClause = "u.role = 'consultant'";
    const params: any[] = [];
    let idx = 1;

    if (filters.search) {
      whereClause += ` AND (u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    if (filters.plan) {
      whereClause += ` AND cp.plan = $${idx}`;
      params.push(filters.plan);
      idx++;
    }

    if (filters.is_active !== undefined) {
      whereClause += ` AND u.is_active = $${idx}`;
      params.push(filters.is_active === 'true' || filters.is_active === true);
      idx++;
    }

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM users u
      LEFT JOIN consultant_plans cp ON cp.consultant_id = u.id
      WHERE ${whereClause}
    `;

    const dataQuery = `
      SELECT u.id, u.full_name, u.email, u.is_active, u.created_at,
        cp.plan, cp.max_companies, cp.max_employees, cp.ai_enabled, cp.white_label, cp.valid_until,
        (SELECT COUNT(*)::int FROM companies WHERE consultant_id = u.id) as company_count
      FROM users u
      LEFT JOIN consultant_plans cp ON cp.consultant_id = u.id
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    const total = await this.dataSource.query(countQuery, params);
    const data = await this.dataSource.query(dataQuery, [...params, limit, offset]);

    return {
      data,
      meta: {
        total: total[0].total,
        page,
        limit,
        totalPages: Math.ceil(total[0].total / limit)
      }
    };
  }

  @Post()
  async create(@Body() dto: any, @CurrentUser() admin: any) {
    const settings = await this.settingsService.getSettings();
    const packages = settings.consultant_packages || {};
    const selectedPackage = packages[dto.plan] || {};

    // Pre-check: email uniqueness
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda.');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create user
      const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      
      const userRes = await manager.query(`
        INSERT INTO users (email, full_name, role, password_hash, is_active)
        VALUES ($1, $2, 'consultant', $3, true) RETURNING id
      `, [dto.email, dto.full_name, passwordHash]);
      
      const userId = userRes[0].id;

      // 2. Create plan (apply package defaults if not overridden)
      await manager.query(`
        INSERT INTO consultant_plans (
          consultant_id, plan, max_companies, max_employees, 
          ai_enabled, white_label, valid_until
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId, 
        dto.plan || 'starter', 
        dto.max_companies ?? selectedPackage.max_companies ?? 5, 
        dto.max_employees ?? selectedPackage.max_employees ?? 100, 
        dto.ai_enabled ?? selectedPackage.ai_enabled ?? false, 
        dto.white_label ?? selectedPackage.white_label ?? false, 
        dto.valid_until || null
      ]);

      // 3. Create invitation
      const inviteToken = crypto.randomBytes(64).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      await manager.query(`
        INSERT INTO invitations (user_id, token, type, expires_at)
        VALUES ($1, $2, 'consultant_invite', $3)
      `, [userId, inviteToken, expiresAt]);

      // 4. Send welcome email (non-blocking — queue failure shouldn't break creation)
      try {
        await this.notificationService.sendConsultantWelcome(dto.email, dto.full_name, inviteToken);
      } catch (mailErr) {
        console.error('[AdminConsultant] Mail queue error (non-fatal):', mailErr.message);
      }

      return { success: true, id: userId };
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userRepository.findOne({ 
      where: { id, role: 'consultant' },
      select: ['id', 'full_name', 'email', 'is_active', 'created_at']
    });
    const plan = await this.planRepository.findOne({ where: { consultant_id: id } });
    const companies = await this.dataSource.query(`
      SELECT id, name, industry, plan, is_active, 
        (SELECT COUNT(*)::int FROM users WHERE company_id = companies.id) as employee_count
      FROM companies 
      WHERE consultant_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [id]);

    return { user, plan, companies };
  }

  @Get(':id/companies')
  async findCompanies(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: any
  ) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT id, name, industry, plan, is_active, created_at,
        (SELECT COUNT(*)::int FROM users WHERE company_id = companies.id) as employee_count
      FROM companies 
      WHERE consultant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const count = await this.dataSource.query(`SELECT COUNT(*)::int as total FROM companies WHERE consultant_id = $1`, [id]);
    const data = await this.dataSource.query(query, [id, limit, offset]);

    return {
      data,
      meta: {
        total: count[0].total,
        page,
        limit,
        totalPages: Math.ceil(count[0].total / limit)
      }
    };
  }

  @Put(':id/plan')
  async updatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    const settings = await this.settingsService.getSettings();
    const packages = settings.consultant_packages || {};
    const selectedPackage = packages[dto.plan] || {};

    const updateData = {
      plan: dto.plan,
      max_companies: dto.max_companies ?? selectedPackage.max_companies,
      max_employees: dto.max_employees ?? selectedPackage.max_employees,
      ai_enabled: dto.ai_enabled ?? selectedPackage.ai_enabled,
      white_label: dto.white_label ?? selectedPackage.white_label,
      valid_until: dto.valid_until,
    };

    await this.planRepository.update({ consultant_id: id }, updateData);
    return { success: true };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body('is_active') is_active: boolean) {
    await this.userRepository.update(id, { is_active });
    return { success: true };
  }

  @Patch(':id/profile')
  async updateProfile(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    // Check for email conflict if email is being changed
    if (dto.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.');
      }
    }

    const updateData: any = {};
    if (dto.full_name) updateData.full_name = dto.full_name;
    if (dto.email)     updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;

    await this.userRepository.update(id, updateData);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.userRepository.findOne({ where: { id, role: 'consultant' } });
    if (!user) throw new ConflictException('Eğitmen bulunamadı.');

    return this.dataSource.transaction(async (manager) => {
      // 1. Detach from companies
      await manager.query('UPDATE companies SET consultant_id = NULL WHERE consultant_id = $1', [id]);
      
      // 2. Clear benchmarks updated_by
      await manager.query('UPDATE benchmarks SET updated_by = NULL WHERE updated_by = $1', [id]);
      
      // 3. Delete billing related records
      await manager.query('DELETE FROM payments WHERE consultant_id = $1', [id]);
      await manager.query('DELETE FROM credit_transactions WHERE consultant_id = $1', [id]);
      await manager.query('DELETE FROM credit_balances WHERE consultant_id = $1', [id]);
      await manager.query('DELETE FROM subscriptions WHERE consultant_id = $1', [id]);
      
      // 4. Delete consultant plan
      await manager.query('DELETE FROM consultant_plans WHERE consultant_id = $1', [id]);
      
      // 5. Delete invitations
      await manager.query('DELETE FROM invitations WHERE user_id = $1', [id]);
      
      // 6. Delete the user
      await manager.query('DELETE FROM users WHERE id = $1', [id]);
      
      return { success: true };
    });
  }
}
