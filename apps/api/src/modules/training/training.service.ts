import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TrainingPlan } from './entities/training-plan.entity';
import { TrainingEvent } from './entities/training-event.entity';
import { TrainingNotification } from './entities/training-notification.entity';
import { ContentEngagementLog } from './entities/content-engagement-log.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { NotificationService } from '../notification/notification.service';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateTrainingPlanDto, UpdateTrainingPlanDto, CreateTrainingEventDto, UpdateTrainingEventDto, SendNotificationDto } from './dto/training.dto';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingPlan)
    private readonly planRepo: Repository<TrainingPlan>,
    @InjectRepository(TrainingEvent)
    private readonly eventRepo: Repository<TrainingEvent>,
    @InjectRepository(TrainingNotification)
    private readonly notifRepo: Repository<TrainingNotification>,
    @InjectRepository(ContentEngagementLog)
    private readonly engagementRepo: Repository<ContentEngagementLog>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {}

  // ── CONSULTANT: Plan CRUD ────────────────────────────────────────

  async createPlan(dto: CreateTrainingPlanDto, consultantId: string) {
    const company = await this.companyRepo.findOne({
      where: { id: dto.company_id, consultant_id: consultantId }
    });
    if (!company) throw new ForbiddenException('Bu firmaya erişim yetkiniz yok');

    const plan = this.planRepo.create({
      title: dto.title,
      description: dto.description,
      companyId: dto.company_id,
      departmentId: dto.department_id,
      startsAt: dto.starts_at ? new Date(dto.starts_at) : undefined,
      endsAt: dto.ends_at ? new Date(dto.ends_at) : undefined,
      consultantId,
      status: 'draft',
    });
    return this.planRepo.save(plan);
  }

  async updatePlan(id: string, dto: UpdateTrainingPlanDto, consultantId: string) {
    const plan = await this.findOwnedPlan(id, consultantId);
    
    if (dto.title) plan.title = dto.title;
    if (dto.description !== undefined) plan.description = dto.description;
    if (dto.department_id !== undefined) plan.departmentId = dto.department_id;
    if (dto.starts_at) plan.startsAt = new Date(dto.starts_at);
    if (dto.ends_at) plan.endsAt = new Date(dto.ends_at);

    return this.planRepo.save(plan);
  }

  // Plan yayınla — HR görür
  async publishPlan(id: string, consultantId: string) {
    const plan = await this.findOwnedPlan(id, consultantId);
    if (!plan.events || plan.events.length === 0) {
      // Re-fetch to check events just in case
      const fullPlan = await this.planRepo.findOne({
        where: { id },
        relations: ['events']
      });
      if (!fullPlan?.events || fullPlan.events.length === 0) {
        throw new BadRequestException('En az bir etkinlik ekleyin');
      }
    }
    
    await this.planRepo.update(id, {
      status: 'published',
      publishedAt: new Date(),
    });

    // HR admin'leri bul ve bildir
    const hrAdmins = await this.userRepo.find({
      where: { company_id: plan.companyId, role: 'hr_admin', is_active: true }
    });

    for (const hr of hrAdmins) {
      await this.notificationService.sendEmail(hr.email, 'training_plan_published', {
        hr_name: hr.full_name,
        consultant_name: plan.consultant?.full_name,
        plan_title: plan.title,
        company_name: plan.company?.name,
        starts_at: plan.startsAt ? new Date(plan.startsAt).toLocaleDateString('tr-TR') : '',
        event_count: String(plan.events?.length ?? 0),
        plan_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/training?plan_id=${id}`,
        platform_url: process.env.APP_URL || 'http://localhost:3000',
      });
    }
    return { published: true };
  }

  async deletePlan(id: string, consultantId: string) {
    const plan = await this.findOwnedPlan(id, consultantId);
    if (plan.status === 'published') {
      throw new BadRequestException('Yayındaki plan silinemez');
    }
    await this.planRepo.delete(id);
    return { deleted: true };
  }

  // ── CONSULTANT: Etkinlik CRUD ─────────────────────────────────────

  async addEvent(planId: string, dto: CreateTrainingEventDto, consultantId: string) {
    const plan = await this.findOwnedPlan(planId, consultantId);

    const event = this.eventRepo.create({
      planId,
      companyId: plan.companyId,
      departmentId: dto.department_id,
      title: dto.title,
      description: dto.description,
      eventType: dto.event_type || 'session',
      scheduledAt: new Date(dto.scheduled_at),
      durationMinutes: dto.duration_minutes || 60,
      contentItemId: dto.content_item_id,
      externalUrl: dto.external_url,
      externalUrlLabel: dto.external_url_label,
      sortOrder: dto.sort_order || 0,
      status: 'upcoming',
    });
    return this.eventRepo.save(event);
  }

  async updateEvent(eventId: string, dto: UpdateTrainingEventDto, consultantId: string) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['plan'],
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    await this.findOwnedPlan(event.planId, consultantId);

    if (dto.title) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.department_id !== undefined) event.departmentId = dto.department_id;
    if (dto.event_type) event.eventType = dto.event_type;
    if (dto.scheduled_at) event.scheduledAt = new Date(dto.scheduled_at);
    if (dto.duration_minutes !== undefined) event.durationMinutes = dto.duration_minutes;
    if (dto.content_item_id !== undefined) event.contentItemId = dto.content_item_id;
    if (dto.external_url !== undefined) event.externalUrl = dto.external_url;
    if (dto.external_url_label !== undefined) event.externalUrlLabel = dto.external_url_label;
    if (dto.sort_order !== undefined) event.sortOrder = dto.sort_order;

    return this.eventRepo.save(event);
  }

  async deleteEvent(eventId: string, consultantId: string) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['plan'],
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');
    await this.findOwnedPlan(event.planId, consultantId);
    await this.eventRepo.delete(eventId);
    return { deleted: true };
  }

  // ── CONSULTANT: Plan listesi ─────────────────────────────────────

  async findPlans(consultantId: string, companyId?: string) {
    const query: any = { consultantId };
    if (companyId) query.companyId = companyId;

    return this.planRepo.find({
      where: query,
      relations: ['company', 'events'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOnePlan(id: string, consultantId: string) {
    return this.findOwnedPlan(id, consultantId);
  }

  // ── HR: Plan görüntüleme ─────────────────────────────────────────

  async findPlansForCompany(companyId: string) {
    return this.planRepo.find({
      where: { companyId, status: 'published' },
      relations: ['consultant', 'events', 'events.department', 'events.contentItem'],
      order: { publishedAt: 'DESC' },
    });
  }

  async findOnePlanForHr(id: string, companyId: string) {
    const plan = await this.planRepo.findOne({
      where: { id, companyId, status: 'published' },
      relations: ['consultant', 'events', 'events.department', 'events.contentItem'],
    });
    if (!plan) throw new NotFoundException('Plan bulunamadı');

    // Etkinlikleri tarihe göre sırala
    plan.events?.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    return plan;
  }

  // ── HR: Etkinlik tamamlandı işareti ──────────────────────────────

  async markEventCompleted(
    eventId: string,
    companyId: string,
    dto: { notes?: string },
    hrUserId: string,
  ) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, companyId }
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');

    await this.eventRepo.update(eventId, {
      status: 'completed',
      completedAt: new Date(),
      completedBy: hrUserId,
      hrNotes: dto.notes,
    });

    this.logger.info('Etkinlik tamamlandı işaretlendi', { service: 'TrainingService' }, { eventId, hrUserId });

    return { completed: true };
  }

  // ── HR: Bilgilendirme maili gönder ───────────────────────────────

  async sendEventNotification(
    eventId: string,
    companyId: string,
    dto: SendNotificationDto,
    hrUserId: string,
  ) {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, companyId },
      relations: ['contentItem', 'department', 'plan', 'plan.consultant'],
    });
    if (!event) throw new NotFoundException('Etkinlik bulunamadı');

    // Alıcıları belirle
    let recipients: any[] = [];

    if (dto.target === 'company') {
      recipients = await this.userRepo.find({
        where: { company_id: companyId, role: 'hr_admin', is_active: true }
      });
    } else if (dto.target === 'department' && event.departmentId) {
      recipients = await this.userRepo.find({
        where: { company_id: companyId, department_id: event.departmentId, is_active: true }
      });
    }

    // Harici alıcılar
    if (dto.extra_emails?.length) {
      for (const email of dto.extra_emails) {
        recipients.push({ email, full_name: email });
      }
    }

    if (recipients.length === 0) {
      throw new BadRequestException('Gönderilecek alıcı bulunamadı');
    }

    const eventDate = new Date(event.scheduledAt);
    const formattedDate = eventDate.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    for (const recipient of recipients) {
      await this.notificationService.sendEmail(recipient.email, 'training_event_reminder', {
        recipient_name: recipient.full_name,
        event_title: event.title,
        event_description: event.description ?? '',
        event_date: formattedDate,
        event_time: formattedTime,
        duration: String(event.durationMinutes),
        event_type: this.getEventTypeLabel(event.eventType),
        department: event.department?.name ?? 'Tüm firma',
        content_url: event.contentItem?.url_tr ?? event.externalUrl ?? '',
        content_label: event.externalUrlLabel ?? 'İçeriği Görüntüle',
        hr_notes: dto.notes ?? '',
        platform_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/training?plan_id=${event.planId}`,
      });
    }

    // Bildirim kaydı
    await this.notifRepo.save({
      eventId,
      companyId,
      departmentId: dto.target === 'department' ? event.departmentId : null,
      sentBy: hrUserId,
      recipientCount: recipients.length,
      subject: dto.subject ?? event.title,
      notes: dto.notes,
    });

    // Engagement log (notify action)
    if (event.contentItemId) {
      await this.engagementRepo.save({
        contentItemId: event.contentItemId,
        trainingEventId: eventId,
        companyId,
        userId: hrUserId,
        action: 'notify',
      });
    }

    return { sent: true, recipients: recipients.length };
  }

  // ── İçerik etkileşim logu ────────────────────────────────────────

  async logEngagement(params: {
    contentItemId: string;
    trainingEventId?: string;
    companyId?: string;
    userId?: string;
    action: string;
    userAgent?: string;
    ip?: string;
  }) {
    await this.engagementRepo.save({
      contentItemId: params.contentItemId,
      trainingEventId: params.trainingEventId,
      companyId: params.companyId,
      userId: params.userId,
      action: params.action,
      userAgent: params.userAgent,
      ipAddress: params.ip,
    });
  }

  // ── İçerik analitik ─────────────────────────────────────────────

  async getContentEngagement(contentItemId: string, consultantId: string) {
    // Sadece consultant'ın firmalarındaki veriler
    return this.engagementRepo
      .createQueryBuilder('e')
      .leftJoin('companies', 'c', 'c.id = e.company_id')
      .where('e.content_item_id = :cid', { cid: contentItemId })
      .andWhere('c.consultant_id = :consId', { consId: consultantId })
      .select([
        'e.action as action',
        'COUNT(*) as count',
        "DATE_TRUNC('day', e.created_at) as date",
      ])
      .groupBy('e.action, date')
      .orderBy('date', 'DESC')
      .getRawMany();
  }

  // ── Yaklaşan etkinlikler — CRON için ─────────────────────────────

  async getUpcomingEvents(daysAhead: number = 3) {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + daysAhead);

    return this.eventRepo.find({
      where: {
        status: 'upcoming',
        scheduledAt: Between(from, to),
      },
      relations: ['plan', 'plan.company', 'department'],
    });
  }

  // ── Yardımcılar ──────────────────────────────────────────────────

  private async findOwnedPlan(id: string, consultantId: string) {
    const plan = await this.planRepo.findOne({
      where: { id, consultantId },
      relations: ['company', 'consultant', 'events'],
    });
    if (!plan) throw new NotFoundException('Plan bulunamadı');
    return plan;
  }

  private getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      session: 'Eğitim Oturumu',
      webinar: 'Webinar',
      workshop: 'Atölye',
      reading: 'Okuma Görevi',
      task: 'Görev',
    };
    return labels[type] ?? type;
  }
}
