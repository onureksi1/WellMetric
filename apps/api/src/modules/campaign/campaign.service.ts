import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { DistributionCampaign, CampaignStatus, CampaignTriggerType } from './entities/distribution-campaign.entity';
import { DistributionLog, DistributionLogStatus } from './entities/distribution-log.entity';
import { CreateCampaignDto, CampaignFilterDto, LogFilterDto, AdminStatsFilterDto } from './dto/campaign.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { SettingsService } from '../settings/settings.service';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { User } from '../user/entities/user.entity';
import { Employee } from '../user/entities/employee.entity';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectRepository(DistributionCampaign)
    private readonly campaignRepo: Repository<DistributionCampaign>,
    @InjectRepository(DistributionLog)
    private readonly logRepo: Repository<DistributionLog>,
    @InjectRepository(SurveyToken)
    private readonly tokenRepo: Repository<SurveyToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(companyId: string, filters: CampaignFilterDto) {
    const query = this.campaignRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.survey', 's')
      .orderBy('c.created_at', 'DESC');

    if (companyId) {
      query.andWhere('c.companyId = :companyId', { companyId });
    }

    if (filters.status) query.andWhere('c.status = :status', { status: filters.status });
    if (filters.period) query.andWhere('c.period = :period', { period: filters.period });
    if (filters.survey_id) query.andWhere('c.surveyId = :surveyId', { surveyId: filters.survey_id });

    const page = filters.page || 1;
    const limit = filters.per_page || 20;

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const enrichedItems = items.map(c => {
      const effective_opens = Math.max(c.opened_count, c.clicked_count, c.completed_count);
      const open_rate = c.sent_count > 0 ? (effective_opens / c.sent_count) * 100 : 0;
      const click_rate = effective_opens > 0 ? (c.clicked_count / effective_opens) * 100 : 0;
      const completion_rate = c.sent_count > 0 ? (c.completed_count / c.sent_count) * 100 : 0;

      return {
        ...c,
        open_rate: parseFloat(open_rate.toFixed(1)),
        click_rate: parseFloat(click_rate.toFixed(1)),
        completion_rate: parseFloat(completion_rate.toFixed(1)),
      };
    });

    return { items: enrichedItems, total, page, limit };
  }

  async findOne(id: string, companyId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id, ...(companyId && { companyId }) },
      relations: ['survey'],
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const effective_opens = Math.max(campaign.opened_count, campaign.clicked_count, campaign.completed_count);
    const open_rate = campaign.sent_count > 0 ? (effective_opens / campaign.sent_count) * 100 : 0;
    const click_rate = effective_opens > 0 ? (campaign.clicked_count / effective_opens) * 100 : 0;
    const completion_rate = campaign.sent_count > 0 ? (campaign.completed_count / campaign.sent_count) * 100 : 0;

    return {
      ...campaign,
      open_rate: parseFloat(open_rate.toFixed(1)),
      click_rate: parseFloat(click_rate.toFixed(1)),
      completion_rate: parseFloat(completion_rate.toFixed(1)),
    };
  }

  async findLogs(campaignId: string, companyId: string, filters: LogFilterDto) {
    const query = this.logRepo.createQueryBuilder('l')
      .where('l.campaignId = :campaignId', { campaignId });

    if (companyId) {
      query.andWhere('l.companyId = :companyId', { companyId });
    }

    if (filters.status) query.andWhere('l.status = :status', { status: filters.status });
    if (filters.completed !== undefined) {
      if (filters.completed) query.andWhere('l.completed_at IS NOT NULL');
      else query.andWhere('l.completed_at IS NULL');
    }

    const page = filters.page || 1;
    const limit = filters.per_page || 50;

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  async create(companyId: string, createdBy: string, dto: CreateCampaignDto) {
    // Validation: Check if scheduled_at is in future
    if (dto.scheduled_at && new Date(dto.scheduled_at) <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    const campaign = this.campaignRepo.create({
      companyId,
      surveyId: dto.survey_id,
      assignmentId: dto.assignment_id,
      period: dto.period,
      createdBy,
      trigger_type: CampaignTriggerType.HR_MANUAL,
      status: dto.scheduled_at ? CampaignStatus.SCHEDULED : CampaignStatus.PENDING,
      scheduled_at: dto.scheduled_at || null,
    });

    const saved = await this.campaignRepo.save(campaign);

    await this.auditService.logAction(createdBy, companyId, 'campaign.create', 'DistributionCampaign', saved.id);

    if (!dto.scheduled_at) {
      await this.dispatch(saved, dto);
    }

    return saved;
  }

  async dispatch(campaign: DistributionCampaign, dto?: CreateCampaignDto) {
    this.logger.log(`Dispatching campaign ${campaign.id} for company ${campaign.companyId}`);
    
    campaign.status = CampaignStatus.SENDING;
    await this.campaignRepo.save(campaign);

    // Fetch company and survey for email context
    const company = await this.userRepo.manager.query(`SELECT name FROM companies WHERE id = $1`, [campaign.companyId]);
    const survey = await this.userRepo.manager.query(`SELECT title_tr FROM surveys WHERE id = $1`, [campaign.surveyId]);
    
    const companyName = company[0]?.name || 'Wellbeing Platformu';
    const surveyTitle = survey[0]?.title_tr || 'Wellbeing Anketi';

    let recipients: Array<{ email: string; fullName: string; token: string; userId?: string; tokenId?: string }> = [];

    // 1. Determine Recipients — targeted, department, or all active employees
    const allEmployees = await this.employeeRepo.find({
      where: { companyId: campaign.companyId, isActive: true },
    });

    // Filter priority: target_employee_ids > department_id > all
    let employees = allEmployees;
    if (dto?.target_employee_ids?.length) {
      employees = allEmployees.filter(e => dto.target_employee_ids!.includes(e.id));
    } else if (dto?.department_id) {
      employees = allEmployees.filter(e => e.departmentId === dto.department_id);
    }

    if (dto?.employee_accounts) {
      // Account Mode: Use User IDs
      recipients = employees.map(u => ({
        email: u.email,
        fullName: u.fullName || 'Değerli Çalışanımız',
        userId: u.id,
        token: '', // No token needed for account mode
      }));
    } else {
      // Token Mode: Ensure tokens exist for all employees
      for (const emp of employees) {
        // Check if token exists for this survey + company + period
        let token = await this.tokenRepo.findOne({
          where: { 
            survey_id: campaign.surveyId, 
            company_id: campaign.companyId, 
            email: emp.email,
            is_used: false 
          }
        });

        if (!token) {
          // Generate new token
          token = this.tokenRepo.create({
            token: crypto.randomBytes(32).toString('hex'),
            survey_id: campaign.surveyId,
            company_id: campaign.companyId,
            assignment_id: campaign.assignmentId,
            email: emp.email,
            full_name: emp.fullName,
            employee_id: emp.id, // Ensure token is linked to employee row so resend UI updates status
            due_at: campaign.scheduled_at, // Use scheduled or now
          });
          await this.tokenRepo.save(token);
        }

        recipients.push({
          email: emp.email,
          fullName: emp.fullName || 'Değerli Çalışanımız',
          token: token.token,
          tokenId: token.id
        });
      }
    }

    campaign.total_recipients = recipients.length;
    await this.campaignRepo.save(campaign);

    // 2. Create Distribution Logs
    const logs = recipients.map(r => this.logRepo.create({
      campaignId: campaign.id,
      companyId: campaign.companyId,
      email: r.email,
      fullName: r.fullName,
      surveyTokenId: r.tokenId,
      userId: r.userId,
      status: DistributionLogStatus.PENDING,
    }));
    const savedLogs = await this.logRepo.save(logs);

    // 3. Queue Emails (Non-blocking)
    for (const log of savedLogs) {
      const recipientData = recipients.find(r => r.email === log.email);
      try {
        await this.notificationService.sendSurveyTokenInvite(
          log.email,
          log.fullName,
          companyName,
          surveyTitle,
          recipientData?.token || '',
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
          'tr',
          log.id
        );
        log.status = DistributionLogStatus.SENT;
        log.sent_at = new Date();
      } catch (err) {
        this.logger.error(`Failed to queue mail for ${log.email}`, err);
        log.status = DistributionLogStatus.FAILED;
      }
    }

    // Save logs status updates
    await this.logRepo.save(savedLogs);

    campaign.status = CampaignStatus.SENT;
    campaign.sent_at = new Date();
    campaign.sent_count = savedLogs.filter(l => l.status === DistributionLogStatus.SENT).length;
    await this.campaignRepo.save(campaign);

    this.logger.log(`Campaign ${campaign.id} dispatch completed. Total: ${campaign.total_recipients}, Sent: ${campaign.sent_count}`);
  }

  async remind(id: string, companyId: string, userId: string) {
    const original = await this.campaignRepo.findOne({
      where: { id, companyId },
      relations: ['logs'],
    });
    if (!original) throw new NotFoundException('Campaign not found');

    const pendingLogs = original.logs.filter(l => !l.completed_at);
    if (pendingLogs.length === 0) throw new BadRequestException('No pending recipients found');

    const reminder = this.campaignRepo.create({
      companyId,
      surveyId: original.surveyId,
      createdBy: userId,
      trigger_type: CampaignTriggerType.HR_REMINDER,
      status: CampaignStatus.PENDING,
      total_recipients: pendingLogs.length,
    });

    const savedReminder = await this.campaignRepo.save(reminder);

    const newLogs = pendingLogs.map(l => this.logRepo.create({
      campaignId: savedReminder.id,
      companyId: companyId,
      email: l.email,
      fullName: l.fullName,
      surveyTokenId: l.surveyTokenId,
      userId: l.userId,
      status: DistributionLogStatus.PENDING,
    }));
    await this.logRepo.save(newLogs);

    await this.dispatch(savedReminder);

    await this.auditService.logAction(userId, companyId, 'campaign.reminder', 'DistributionCampaign', savedReminder.id);
    return savedReminder;
  }

  async cancel(id: string, companyId: string, userId: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id, companyId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled campaigns can be cancelled');
    }

    campaign.status = CampaignStatus.CANCELLED;
    await this.campaignRepo.save(campaign);

    await this.auditService.logAction(userId, companyId, 'campaign.cancel', 'DistributionCampaign', id);
    return campaign;
  }

  async trackOpen(logId: string) {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (log) {
      if (!log.opened_at) {
        log.opened_at = new Date();
        await this.logRepo.save(log);
        await this.campaignRepo.increment({ id: log.campaignId }, 'opened_count', 1);
      }
    }
    // Return 1x1 transparent PNG
    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  }

  async trackClick(logId: string) {
    const log = await this.logRepo.findOne({ 
      where: { id: logId },
      relations: ['campaign', 'campaign.survey'] 
    });
    
    if (log) {
      if (!log.clicked_at) {
        log.clicked_at = new Date();
        await this.logRepo.save(log);
        await this.campaignRepo.increment({ id: log.campaignId }, 'clicked_count', 1);
      }

      const settings = await this.settingsService.getSettings();
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || settings?.platform_url || 'https://app.wellanalytics.io';

      if (log.surveyTokenId) {
        // Find token string
        const token = await this.tokenRepo.findOne({ where: { id: log.surveyTokenId } });
        return `${platformUrl}/surveys/${token?.token}`;
      }
      return `${platformUrl}/dashboard/surveys/${log.campaign.surveyId}`;
    }
    return null;
  }

  async markCompleted(surveyTokenId: string) {
    const log = await this.logRepo.findOne({ where: { surveyTokenId } });
    if (log && !log.completed_at) {
      log.completed_at = new Date();
      await this.logRepo.save(log);
      await this.campaignRepo.increment({ id: log.campaignId }, 'completed_count', 1);
    }
  }

  async syncDeliveryStatus() {
    // Sync with mail provider logic
    this.logger.log('Syncing mail delivery status...');
  }

  async getPlatformStats(filters: AdminStatsFilterDto) {
    const query = this.campaignRepo.createQueryBuilder('c');
    
    if (filters.company_id) query.andWhere('c.companyId = :companyId', { companyId: filters.company_id });
    if (filters.period) query.andWhere('c.period = :period', { period: filters.period });

    const campaigns = await query.getMany();
    
    const total_campaigns = campaigns.length;
    const avg_open_rate = campaigns.length > 0 
      ? campaigns.reduce((acc, c) => acc + (c.sent_count > 0 ? (c.opened_count / c.sent_count) : 0), 0) / campaigns.length * 100
      : 0;
    const avg_completion_rate = campaigns.length > 0
      ? campaigns.reduce((acc, c) => acc + (c.sent_count > 0 ? (c.completed_count / c.sent_count) : 0), 0) / campaigns.length * 100
      : 0;

    return {
      total_campaigns,
      avg_open_rate: parseFloat(avg_open_rate.toFixed(1)),
      avg_completion_rate: parseFloat(avg_completion_rate.toFixed(1)),
    };
  }
}
