import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MailTemplate } from './entities/mail-template.entity';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from './notification.service';

@Injectable()
export class MailTemplateService {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(MailTemplateService.name);

  constructor(
    @InjectRepository(MailTemplate)
    private readonly templateRepository: Repository<MailTemplate>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async findAll() {
    return this.templateRepository.find({
      select: ['id', 'slug', 'subject_tr', 'subject_en', 'variables', 'description', 'updated_at', 'is_active'],
      order: { slug: 'ASC' }
    });
  }

  async findOne(slug: string) {
    const template = await this.templateRepository.findOne({ where: { slug } });
    if (!template) throw new NotFoundException('Şablon bulunamadı');
    return template;
  }

  async update(slug: string, dto: UpdateTemplateDto, userId: string) {
    const template = await this.findOne(slug);
    
    await this.templateRepository.update(template.id, {
      ...dto,
      updated_by: userId,
      updated_at: new Date(),
    });

    // Invalidate cache
    await this.redisClient.del(`template:${slug}:tr`);
    await this.redisClient.del(`template:${slug}:en`);

    await this.auditService.log({
      action: 'mail_template.update',
      targetType: 'mail_template',
      targetId: template.id,
      userId: userId,
      companyId: null,
      payload: { slug, updates: dto },
    });

    return this.findOne(slug);
  }

  async reset(slug: string, userId: string) {
    // Note: In a real system, we might want to store the "factory" defaults 
    // in a separate table or constant. For simplicity here, we assume 
    // the user wants to revert to what's in the initial migration logic.
    // However, since we don't have the original HTML here easily, 
    // we'll leave this as a placeholder or fetch from a "defaults" constant.
    
    // For this implementation, I'll assume we have a way to get the default.
    // A better approach is to have a 'is_customized' flag and fallback to a 'default_body' column.
    
    throw new InternalServerErrorException('Sıfırlama işlemi şu an yapılandırılamadı.');
  }

  async render(slug: string, language: string, variables: Record<string, string>): Promise<string> {
    const cacheKey = `template:${slug}:${language}`;
    const cached = await this.redisClient.get(cacheKey);
    
    let body: string;
    let subject: string;

    if (cached) {
      const parsed = JSON.parse(cached);
      body = parsed.body;
    } else {
      const template = await this.templateRepository.findOne({ where: { slug } });
      if (!template) throw new Error(`Template ${slug} not found`);

      body = (language === 'en' && template.body_en) ? template.body_en : template.body_tr;
      
      // Cache for 1 hour
      await this.redisClient.set(cacheKey, JSON.stringify({ body }), 'EX', 3600);
    }

    // Replace variables
    let rendered = body;
    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeHtml(value);
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), escapedValue);
    }

    return rendered;
  }

  async sendTest(slug: string, to: string, language: string = 'tr', notificationService: NotificationService) {
    try {
      this.logger.log(`Starting test mail dispatch for slug: ${slug}, to: ${to}, lang: ${language}`);
      const template = await this.findOne(slug);
      const platformUrl = this.configService.get<string>('PLATFORM_URL', 'https://app.wellanalytics.io');

      const testVars: Record<string, string> = {
        full_name: 'Test Kullanıcı',
        hr_name: 'Test HR Yöneticisi',
        company_name: 'Test Firması',
        invite_link: `${platformUrl}/invite?token=test`,
        survey_link: `${platformUrl}/surveys/test`,
        dashboard_link: `${platformUrl}/dashboard`,
        period: 'Nisan 2026',
        score: '72',
        previous_score: '65',
        dimension: 'Zihinsel Sağlık',
        days_remaining: '3',
        survey_title: 'Çalışan Bağlılığı Araştırması',
        due_date: '30.04.2026',
        participation_rate: '85',
        format: 'PDF',
        download_link: `${platformUrl}/downloads/test`,
        support_email: 'destek@wellanalytics.io',
        bounced_count: '12',
        expires_in: '24 saat',
        plan_name: 'Premium Kurumsal'
      };

      const renderedBody = await this.render(slug, language, testVars);
      const subject = (language === 'en' && template.subject_en) ? template.subject_en : template.subject_tr;

      this.logger.log(`Rendering complete. Handing over to NotificationService...`);
      
      // Send immediately via NotificationService (sync test)
      await notificationService.sendMailDirectly({
        to,
        subject: `[TEST] ${subject}`,
        html: renderedBody
      });

      this.logger.log(`Test mail sent successfully to ${to}`);
      return { success: true, message: 'Test maili başarıyla gönderildi!' };
    } catch (error: any) {
      this.logger.error(`Test mail failed for ${slug}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Test maili gönderilemedi: ${error.message}. Lütfen mail sağlayıcı ayarlarınızı kontrol edin.`
      );
    }
  }

  private escapeHtml(text: any): string {
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
