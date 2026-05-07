import { Injectable, UseGuards } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { CronLockGuard } from './guards/cron-lock.guard';
import { ScoreService } from '../score/score.service';
import { AIService } from '../ai/ai.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { CampaignService } from '../campaign/campaign.service';
import { CreditService } from '../billing/services/credit.service';
import { AppLogger } from '../../common/logger/app-logger.service';
import { EmployeeSurveyService } from '../user/employee-survey.service';
import { EmployeesService } from '../user/employees.service';
import { SubscriptionRenewalService } from '../billing/services/subscription-renewal.service';
import { CreditAlertService } from '../billing/services/credit-alert.service';
import { TrainingService } from '../training/training.service';
import { InAppNotificationService } from '../notification/in-app-notification.service';

@Injectable()
export class CronService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scoreService: ScoreService,
    private readonly aiService: AIService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly campaignService: CampaignService,
    private readonly creditService: CreditService,
    private readonly cronLockGuard: CronLockGuard,
    @InjectQueue('ai-queue') private readonly aiQueue: Queue,
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
    @InjectQueue('score-queue') private readonly scoreQueue: Queue,
    @InjectQueue('report-queue') private readonly reportQueue: Queue,
    private readonly employeeSurveyService: EmployeeSurveyService,
    private readonly employeesService: EmployeesService,
    private readonly subscriptionRenewalService: SubscriptionRenewalService,
    private readonly creditAlertService: CreditAlertService,
    private readonly trainingService: TrainingService,
    private readonly inAppNotifService: InAppNotificationService,
    private readonly logger: AppLogger,
  ) {}

  @Cron('*/5 * * * *', { timeZone: 'Europe/Istanbul' })
  async checkScheduledCampaigns() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.checkScheduledCampaigns } as any))) return;
    const start = Date.now();
    this.logger.info('CRON checkScheduledCampaigns başladı', { service: 'CronService' });

    try {
      const scheduled = await this.dataSource.query(
        `SELECT id FROM distribution_campaigns 
         WHERE status = 'scheduled' AND scheduled_at <= NOW()`
      );

      for (const campaignData of scheduled) {
         this.logger.info(`Dispatching campaign: ${campaignData.id}`, { service: 'CronService' });
         await this.dataSource.query(
           `UPDATE distribution_campaigns SET status = 'sending', updated_at = NOW() WHERE id = $1`,
           [campaignData.id]
         );
      }
      this.logger.info('CRON checkScheduledCampaigns tamamlandı', { service: 'CronService' },
        { duration: Date.now() - start, count: scheduled.length });
    } catch (err) {
      this.logger.fatal('CRON checkScheduledCampaigns CRASHED', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('checkScheduledCampaigns');
    }
  }

  @Cron('0 3 * * *', { timeZone: 'Europe/Istanbul' })
  async syncMailDeliveryStatus() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.syncMailDeliveryStatus } as any))) return;
    const start = Date.now();
    this.logger.info('CRON syncMailDeliveryStatus başladı', { service: 'CronService' });
    
    try {
      // Placeholder for actual sync logic
      this.logger.info('CRON syncMailDeliveryStatus tamamlandı', { service: 'CronService' },
        { duration: Date.now() - start });
    } catch (err) {
      this.logger.error('CRON syncMailDeliveryStatus hatası', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('syncMailDeliveryStatus');
    }
  }

  @Cron('0 9 1 * *', { timeZone: 'Europe/Istanbul' })
  async triggerGlobalSurvey() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.triggerGlobalSurvey } as any))) return;
    this.logger.log('Starting global survey trigger...');
    const period = new Date().toISOString().slice(0, 7);
    
    try {
      const globalSurvey = await this.dataSource.query(
        `SELECT id, title FROM surveys WHERE type = 'global' AND is_active = true LIMIT 1`
      );
      if (!globalSurvey.length) return;

      const activeCompanies = await this.dataSource.query(`SELECT id, name, settings FROM companies WHERE is_active = true`);
      let invitationCount = 0;

      for (const company of activeCompanies) {
        // 1. Upsert assignment
        const dueAt = new Date();
        dueAt.setDate(15);
        dueAt.setHours(23, 59, 59, 999);

        const assignment = await this.dataSource.query(
          `INSERT INTO survey_assignments (survey_id, company_id, period, status, due_at)
           VALUES ($1, $2, $3, 'active', $4)
           ON CONFLICT (survey_id, company_id, period) DO NOTHING
           RETURNING id`,
          [globalSurvey[0].id, company.id, period, dueAt]
        );

        if (!assignment.length) continue;

        const isAccountMode = company.settings?.employee_accounts === true;

        if (isAccountMode) {
          const employees = await this.dataSource.query(
            `SELECT id, email, full_name, language FROM users 
             WHERE company_id = $1 AND role = 'employee' AND is_active = true
             AND (next_allowed_at IS NULL OR next_allowed_at <= NOW())`,
            [company.id]
          );

          for (const emp of employees) {
            const token = crypto.randomBytes(64).toString('hex');
            await this.dataSource.query(
              `INSERT INTO invitations (company_id, email, type, token, expires_at)
               VALUES ($1, $2, 'survey_invite', $3, $4)`,
              [company.id, emp.email, token, dueAt]
            );
            
            console.log(`[CRON] Sending survey_invite to employee: ${emp.email}`);
            await this.notificationService.sendSurveyTokenInvite(
              emp.email, emp.full_name, company.name, globalSurvey[0].title, token, dueAt, emp.language || 'tr'
            );
            invitationCount++;
          }
        } else {
          // Hesapsız mod — employees tablosundan token gönder
          const result = await this.employeeSurveyService.sendSurveyToAll(
            company.id,
            globalSurvey[0].id,
            period,
          );
          invitationCount += result.sent;
        }
      }

      await this.auditService.logAction('system', null, 'cron.survey_trigger', 'surveys', null, {
        period, company_count: activeCompanies.length, invitation_count: invitationCount
      });
    } catch (e) {
      this.logger.error('Error in triggerGlobalSurvey', e);
    } finally {
      await this.cronLockGuard.releaseLock('triggerGlobalSurvey');
    }
  }

  @Cron('0 9 * * *', { timeZone: 'Europe/Istanbul' })
  async checkPendingSurveys() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.checkPendingSurveys } as any))) return;
    this.logger.log('Checking pending surveys for reminders...');

    try {
      const activeAssignments = await this.dataSource.query(
        `SELECT sa.id, sa.survey_id, sa.company_id, sa.period, sa.due_at, s.title, c.name as company_name, c.settings
         FROM survey_assignments sa
         JOIN surveys s ON sa.survey_id = s.id
         JOIN companies c ON sa.company_id = c.id
         WHERE sa.status = 'active' AND sa.due_at > NOW() AND sa.due_at <= NOW() + INTERVAL '3 days'`
      );

      for (const sa of activeAssignments) {
        const daysRemaining = Math.ceil((new Date(sa.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isAccountMode = sa.settings?.employee_accounts === true;

        if (isAccountMode) {
          const pendingUsers = await this.dataSource.query(
            `SELECT u.email, u.full_name, u.language FROM users u
             WHERE u.company_id = $1 AND u.role = 'employee' AND u.is_active = true
             AND NOT EXISTS (SELECT 1 FROM survey_responses sr WHERE sr.user_id = u.id AND sr.survey_id = $2 AND sr.period = $3)`,
            [sa.company_id, sa.survey_id, sa.period]
          );

          for (const u of pendingUsers) {
            await this.notificationService.sendSurveyReminder(u.email, u.full_name, sa.title, '', daysRemaining, u.language);
          }

          // Draft reminders
          const draftUsers = await this.dataSource.query(
            `SELECT u.email, u.full_name, u.language FROM draft_responses dr
             JOIN users u ON dr.user_id = u.id
             WHERE dr.survey_id = $1 AND dr.last_updated_at < NOW() - INTERVAL '24 hours'`,
            [sa.survey_id]
          );
          for (const u of draftUsers) {
            await this.notificationService.sendDraftReminder(u.email, u.full_name, sa.title, '', new Date(sa.due_at), u.language);
          }
        } else {
          const pendingTokens = await this.dataSource.query(
            `SELECT email, full_name, language, token FROM survey_tokens 
             WHERE assignment_id = $1 AND is_used = false AND expires_at > NOW()`,
            [sa.id]
          );
          for (const t of pendingTokens) {
            await this.notificationService.sendSurveyReminder(t.email, t.full_name, sa.title, t.token, daysRemaining, t.language);
          }
        }
      }
    } catch (e) {
      this.logger.error('Error in checkPendingSurveys', e);
    } finally {
      await this.cronLockGuard.releaseLock('checkPendingSurveys');
    }
  }

  @Cron('0 2 * * *', { timeZone: 'Europe/Istanbul' })
  async recalculateScores() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.recalculateScores } as any))) return;
    const start = Date.now();
    this.logger.info('CRON recalculateScores başladı', { service: 'CronService' });
    try {
      await this.scoreService.recalculateScores();
      this.logger.info('CRON recalculateScores tamamlandı', { service: 'CronService' },
        { duration: Date.now() - start });
    } catch (err) {
      this.logger.fatal('CRON recalculateScores CRASHED', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('recalculateScores');
    }
  }

  @Cron('0 10 16 * *', { timeZone: 'Europe/Istanbul' })
  async closeMonthlySurvey() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.closeMonthlySurvey } as any))) return;
    const start = Date.now();
    this.logger.info('CRON closeMonthlySurvey başladı', { service: 'CronService' });
    try {
      const expiredAssignments = await this.dataSource.query(
        `UPDATE survey_assignments SET status = 'expired', updated_at = NOW()
         WHERE status = 'active' AND due_at <= NOW()
         RETURNING id, company_id, survey_id, period`
      );

      for (const sa of expiredAssignments) {
        // 1. Close tokens
        await this.dataSource.query(
          `UPDATE survey_tokens SET is_used = true WHERE assignment_id = $1 AND is_used = false`, [sa.id]
        );

        // 2. Trigger AI summary
        const company = await this.dataSource.query(`SELECT language FROM companies WHERE id = $1`, [sa.company_id]);
        await this.aiQueue.add('open_text_summary', {
          companyId: sa.company_id,
          surveyId: sa.survey_id,
          period: sa.period,
          language: company[0]?.language || 'tr'
        });

        // 3. Notify HR Admins
        const hrAdmins = await this.dataSource.query(
          `SELECT email, full_name FROM users WHERE company_id = $1 AND role = 'hr_admin' AND is_active = true`, [sa.company_id]
        );
        const compInfo = await this.dataSource.query(`SELECT name FROM companies WHERE id = $1`, [sa.company_id]);
        
        for (const admin of hrAdmins) {
          await this.notificationService.sendSurveyClosed(
            admin.email, admin.full_name, compInfo[0]?.name, sa.period, 85, company[0]?.language || 'tr'
          );
        }
      }
      this.logger.info('CRON closeMonthlySurvey tamamlandı', { service: 'CronService' },
        { duration: Date.now() - start, count: expiredAssignments.length });
    } catch (err) {
      this.logger.fatal('CRON closeMonthlySurvey CRASHED', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('closeMonthlySurvey');
    }
  }

  @Cron('0 8 17 * *', { timeZone: 'Europe/Istanbul' })
  async generateTrendAnalysis() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.generateTrendAnalysis } as any))) return;
    try {
      const period = new Date().toISOString().slice(0, 7);
      const activeCompanies = await this.dataSource.query(`SELECT id, language FROM companies WHERE is_active = true`);

      for (const comp of activeCompanies) {
        await this.aiQueue.add('trend_analysis', {
          companyId: comp.id,
          period,
          language: comp.language || 'tr'
        });
      }

      // Platform anomaly
      await this.aiQueue.add('admin_anomaly', { period });
    } catch (e) {
      this.logger.error('Error in generateTrendAnalysis', e);
    } finally {
      await this.cronLockGuard.releaseLock('generateTrendAnalysis');
    }
  }

  @Cron('0 8 28 * *', { timeZone: 'Europe/Istanbul' })
  async checkPlanExpiry() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.checkPlanExpiry } as any))) return;
    try {
      const expiring = await this.dataSource.query(
        `SELECT id, name, plan_expires_at, settings FROM companies 
         WHERE is_active = true AND plan_expires_at > NOW() AND plan_expires_at < NOW() + INTERVAL '7 days'`
      );

      for (const comp of expiring) {
        const daysRemaining = Math.ceil((new Date(comp.plan_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const contactEmail = comp.settings?.billing_email || 'billing@wellanalytics.io';
        await this.notificationService.sendPlanExpiry(contactEmail, comp.name, daysRemaining, 'Standard');
      }
    } catch (e) {
      this.logger.error('Error in checkPlanExpiry', e);
    } finally {
      await this.cronLockGuard.releaseLock('checkPlanExpiry');
    }
  }

  @Cron('0 3 1 * *', { timeZone: 'Europe/Istanbul' })
  async cleanOldAuditLogs() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.cleanOldAuditLogs } as any))) return;
    try {
      this.logger.log('Starting old audit logs cleanup...');
      await this.auditService.cleanOldAuditLogs();
    } catch (e) {
      this.logger.error('Error in cleanOldAuditLogs', e);
    } finally {
      await this.cronLockGuard.releaseLock('cleanOldAuditLogs');
    }
  }

  @Cron('0 0 1 * *', { timeZone: 'Europe/Istanbul' })
  async monthlyBalanceReset() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.monthlyBalanceReset } as any))) return;
    try {
      this.logger.info('CRON monthlyBalanceReset (used_this_month) başladı', { service: 'CronService' });
      await this.dataSource.query(`UPDATE credit_balances SET used_this_month = 0`);
    } catch (err) {
      this.logger.error('CRON monthlyBalanceReset HATA', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('monthlyBalanceReset');
    }
  }

  @Cron('0 10 * * *', { timeZone: 'Europe/Istanbul' })
  async checkLowCredits() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.checkLowCredits } as any))) return;
    
    try {
      const lowBalances = await this.dataSource.query(
        `SELECT b.*, u.email, u.full_name, t.label_tr 
         FROM credit_balances b
         JOIN users u ON b.consultant_id = u.id
         JOIN credit_types t ON b.credit_type_key = t.key
         WHERE b.balance > 0 AND b.balance < 10` // Example threshold
      );

      for (const b of lowBalances) {
        // Notify consultant (placeholder for specific notification method)
        this.logger.warn(`Consultant ${b.full_name} has low ${b.label_tr}: ${b.balance}`);
      }
    } catch (e) {
      this.logger.error('Error in checkLowCredits', e);
    } finally {
      await this.cronLockGuard.releaseLock('checkLowCredits');
    }
  }

  @Cron('0 8 * * *', { timeZone: 'Europe/Istanbul' })
  async runSubscriptionRenewals() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.runSubscriptionRenewals } as any))) return;
    const start = Date.now();
    this.logger.info('CRON runSubscriptionRenewals başladı', { service: 'CronService' });

    try {
      const stats = await this.subscriptionRenewalService.processRenewals();
      
      await this.auditService.logAction('system', null, 'cron.subscription_renewal', 'subscriptions', null, stats);
      
      this.logger.info('CRON runSubscriptionRenewals tamamlandı', { service: 'CronService' }, {
        duration: Date.now() - start,
        ...stats
      });
    } catch (err) {
      this.logger.fatal('CRON runSubscriptionRenewals CRASHED', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('runSubscriptionRenewals');
    }
  }

  // Her gün 10:00 — düşük bakiye kontrolü
  @Cron('0 10 * * *', { timeZone: 'Europe/Istanbul' })
  async checkLowCreditBalances() {
    const start = Date.now();
    this.logger.info('CRON checkLowCreditBalances başladı', { service: 'CronService' });

    try {
      const result = await this.creditAlertService.checkLowBalances();
      this.logger.info('CRON checkLowCreditBalances tamamlandı', { service: 'CronService' }, {
        duration: Date.now() - start,
        alerted:  result.alerted,
      });
    } catch (err) {
      this.logger.fatal('CRON checkLowCreditBalances CRASHED', { service: 'CronService' }, err);
    }
  }

  // ── Her ayın 1'i saat 09:00 — pasif çalışan bildirimi ────────────
  @Cron('0 9 1 * *', { timeZone: 'Europe/Istanbul' })
  async notifyInactiveEmployees() {
    const start = Date.now();
    this.logger.info('CRON notifyInactiveEmployees başladı', { service: 'CronService' });

    try {
      // 180 günden fazla pasif olan çalışanları şirket bazında grupla
      const rows = await this.dataSource.query(`
        SELECT
          e.company_id,
          c.name           AS company_name,
          u.email          AS hr_email,
          COUNT(*)::int    AS stale_count
        FROM employees e
        JOIN companies c ON c.id = e.company_id
        JOIN users u ON u.company_id = e.company_id
          AND u.role IN ('hr_admin', 'super_admin')
          AND u.is_active = true
        WHERE e.is_active = false
          AND e.deactivated_at IS NOT NULL
          AND e.deactivated_at < NOW() - INTERVAL '180 days'
        GROUP BY e.company_id, c.name, u.email
        ORDER BY stale_count DESC
      `);

      if (rows.length === 0) {
        this.logger.info('Bildirim gönderilecek pasif çalışan yok', { service: 'CronService' });
        return;
      }

      // Her HR adminine bildirim maili gönder
      for (const row of rows) {
        try {
          await this.notificationService.sendMailDirectly({
            to:      row.hr_email,
            subject: `${row.stale_count} çalışan 6+ aydır pasif — ${row.company_name}`,
            html: [
              `<p>Merhaba,</p>`,
              `<p><strong>${row.stale_count}</strong> çalışan 180 günden fazladır pasif durumda.</p>`,
              `<p>Temizlemek ister misiniz? Lütfen çalışan listesini inceleyerek kalıcı silme işlemini kendiniz gerçekleştirin.</p>`,
              `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/employees?filter=inactive">→ Çalışan Listesine Git</a></p>`,
              `<p><em>Bu işlem otomatik olarak gerçekleştirilmez. Silme kararı her zaman size aittir.</em></p>`,
            ].join('\n'),
          });

          this.logger.info('Pasif çalışan bildirimi gönderildi', { service: 'CronService' }, {
            hr_email:    row.hr_email,
            company:     row.company_name,
            stale_count: row.stale_count,
          });
        } catch (mailErr) {
          this.logger.error('Bildirim maili gönderilemedi', { service: 'CronService' }, {
            hr_email: row.hr_email,
            error:    mailErr.message,
          });
        }
      }

      this.logger.info('CRON notifyInactiveEmployees tamamlandı', { service: 'CronService' }, {
        duration:        Date.now() - start,
        notified_groups: rows.length,
      });

    } catch (e) {
      this.logger.error('CRON notifyInactiveEmployees HATA', { service: 'CronService' }, { message: e?.message ?? String(e) });
    }
  }

  // Her sabah 08:30 — 3 gün içindeki etkinlikleri kontrol
  @Cron('30 8 * * *', { timeZone: 'Europe/Istanbul' })
  async remindUpcomingTrainingEvents() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.remindUpcomingTrainingEvents } as any))) return;
    const start = Date.now();
    this.logger.info('CRON remindUpcomingTrainingEvents başladı', { service: 'CronService' });

    try {
      const events = await this.trainingService.getUpcomingEvents(3);

      for (const event of events) {
        // Sadece plan published ise
        if (event.plan?.status !== 'published') continue;

        const daysLeft = Math.ceil((new Date(event.scheduledAt).getTime() - Date.now()) / 86400000);

        // HR adminlere otomatik hatırlatma
        const hrAdmins = await this.dataSource.query(
          `SELECT email, full_name FROM users WHERE company_id = $1 AND role = 'hr_admin' AND is_active = true`,
          [event.plan.companyId]
        );

        for (const hr of hrAdmins) {
          await this.notificationService.sendEmail(hr.email, 'training_event_auto_reminder', {
            hr_name: hr.full_name,
            event_title: event.title,
            days_left: String(daysLeft),
            event_date: new Date(event.scheduledAt).toLocaleDateString('tr-TR', {
              weekday: 'long', day: 'numeric', month: 'long'
            }),
            event_time: new Date(event.scheduledAt).toLocaleTimeString('tr-TR', {
              hour: '2-digit', minute: '2-digit'
            }),
            department: event.department?.name ?? 'Tüm firma',
            plan_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/training?plan_id=${event.planId}`,
          });
        }
      }

      this.logger.info('CRON remindUpcomingTrainingEvents tamamlandı', { service: 'CronService' }, {
        duration: Date.now() - start,
        eventCount: events.length,
      });
    } catch (err) {
      this.logger.fatal('CRON remindUpcomingTrainingEvents CRASHED', { service: 'CronService' }, err);
    } finally {
      await this.cronLockGuard.releaseLock('remindUpcomingTrainingEvents');
    }
  }

  // ── Anket süresi doluyor (3 gün kala bildirim) ───────────────
  @Cron('0 9 * * *', { timeZone: 'Europe/Istanbul' })
  async notifyExpiringCampaigns() {
    if (!(await this.cronLockGuard.canActivate({ getHandler: () => this.notifyExpiringCampaigns } as any))) return;
    
    try {
      const expiring = await this.dataSource.query(`
        SELECT sa.id, s.title_tr as title, sa.due_at,
               u.id as hr_id
        FROM survey_assignments sa
        JOIN surveys s ON s.id = sa.survey_id
        JOIN users u ON u.company_id = sa.company_id
          AND u.role = 'hr_admin' AND u.is_active = true
        WHERE sa.status = 'active'
          AND sa.due_at::date = (NOW() + INTERVAL '3 days')::date
      `);

      for (const row of expiring) {
        await this.inAppNotifService.create({
          userId:  row.hr_id,
          type:    'survey_expiring',
          titleTr: `Anket süresi doluyor: ${row.title}`,
          titleEn: `Survey expiring: ${row.title}`,
          bodyTr:  '3 gün içinde sona erecek. Hatırlatma gönderin.',
          bodyEn:  'Expires in 3 days. Send a reminder.',
          link:    `/dashboard/surveys`,
          metadata: { assignment_id: row.id },
        });
      }
    } catch (e) {
      this.logger.error('Error in notifyExpiringCampaigns', e);
    } finally {
      await this.cronLockGuard.releaseLock('notifyExpiringCampaigns');
    }
  }
}
