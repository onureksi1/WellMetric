import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DemoRequest } from './entities/demo.entity';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemoFilterDto } from './dto/demo-filter.dto';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(DemoRequest)
    private readonly demoRepository: Repository<DemoRequest>,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  async create(dto: CreateDemoRequestDto) {
    // Check if email already exists
    const existing = await this.demoRepository.findOne({ 
      where: { email: dto.email } 
    });

    if (existing) {
      throw new BadRequestException('Bu e-posta adresi ile zaten bir başvurunuz bulunuyor.');
    }

    const request = this.demoRepository.create(dto);
    const saved = await this.demoRepository.save(request);

    // Notify Super Admin
    const settings = await this.settingsService.getSettings();
    const adminEmail = settings?.admin_email || process.env.SUPER_ADMIN_EMAIL || 'admin@wellanalytics.io';
    
    try {
      await this.notificationService.sendDemoRequest(adminEmail, saved);
    } catch (e) {
      console.error('Demo request notification failed', e);
    }

    await this.auditService.logAction(
      'system',
      null,
      'demo_request.create',
      'demo_requests',
      saved.id,
      { email: saved.email }
    );

    return { success: true };
  }

  async findAll(filters: DemoFilterDto) {
    const { status, search, date_from, date_to, page = 1, per_page = 20 } = filters;
    
    const query = this.demoRepository.createQueryBuilder('demo')
      .leftJoinAndSelect('demo.assigned_to_user', 'user')
      .orderBy('demo.created_at', 'DESC');

    if (status) {
      query.andWhere('demo.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(demo.full_name ILIKE :search OR demo.email ILIKE :search OR demo.company_name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (date_from) {
      query.andWhere('demo.created_at >= :from', { from: new Date(date_from) });
    }

    if (date_to) {
      query.andWhere('demo.created_at <= :to', { to: new Date(date_to) });
    }

    const [data, total] = await query
      .take(per_page)
      .skip((page - 1) * per_page)
      .getManyAndCount();

    return {
      data: data.map(req => ({
        ...req,
        assigned_to_name: req.assigned_to_user?.full_name || null
      })),
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async findOne(id: string) {
    const request = await this.demoRepository.findOne({ 
      where: { id },
      relations: ['assigned_to_user']
    });
    if (!request) throw new NotFoundException('Demo talebi bulunamadı');
    return request;
  }

  async updateStatus(id: string, status: string, notes?: string, adminId?: string) {
    const request = await this.findOne(id);
    const oldStatus = request.status;
    request.status = status;
    if (notes !== undefined) request.notes = notes;
    request.updated_at = new Date();
    
    const saved = await this.demoRepository.save(request);

    await this.auditService.logAction(
      adminId || 'system',
      null,
      'demo_request.status_change',
      'demo_requests',
      id,
      { oldStatus, newStatus: status }
    );

    return saved;
  }

  async updateNotes(id: string, notes: string) {
    const request = await this.findOne(id);
    request.notes = notes;
    request.updated_at = new Date();
    return this.demoRepository.save(request);
  }
  
  async getPendingCount() {
    return this.demoRepository.count({ where: { status: 'pending' } });
  }

  async getStats() {
    const total = await this.demoRepository.count();
    const pending = await this.demoRepository.count({ where: { status: 'pending' } });
    const contacted = await this.demoRepository.count({ where: { status: 'contacted' } });
    const converted = await this.demoRepository.count({ where: { status: 'converted' } });
    
    return {
      total,
      pending,
      contacted,
      converted,
      conversion_rate: total > 0 ? Math.round((converted / total) * 100) : 0
    };
  }
}
