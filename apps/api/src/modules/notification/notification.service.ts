import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { SettingsService } from '../settings/settings.service';
import { DimensionLabels } from '../../common/constants/dimension-labels';
import { MailProviderFactory } from './providers/mail-provider.factory';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
    private readonly settingsService: SettingsService,
    private readonly providerFactory: MailProviderFactory,
  ) {}

  /**
   * Sends a mail directly bypassing the queue (used for testing)
   */
  async sendMailDirectly(options: { to: string; subject: string; html: string }) {
    this.logger.log(`Direct mail dispatch requested for ${options.to}`);
    const provider = await this.providerFactory.getProvider();
    const settings = await this.settingsService.getSettings();
    
    this.logger.log(`Using provider: ${settings?.mail_provider || 'default'}`);
    
    const result = await provider.send({
      ...options,
      from: settings?.mail_from_address || 'no-reply@mg.wellbeingmetric.com',
      from_name: settings?.mail_from_name || 'Wellbeing Metric',
    });
    
    this.logger.log(`Provider delivery method completed.`);
    return result;
  }

  private async getPlatformUrl(): Promise<string> {
    const settings = await this.settingsService.getSettings();
    return process.env.NEXT_PUBLIC_APP_URL || settings?.platform_url || 'https://app.wellbeingmetric.com';
  }

  private async addToQueue(template: string, to: string, subject: string, variables: Record<string, string>, language: string, companyId?: string, consultantId?: string) {
    try {
      console.log(`[Notification] Adding job to queue: ${template} to ${to}`);
      await this.mailQueue.add('send_mail', {
        template,
        to,
        subject,
        variables,
        language,
        companyId,
        consultantId,
      }, {
        attempts: 3,
        backoff: { type: 'fixed', delay: 120000 }, // 2 mins
      });
      console.log(`[Notification] Job successfully added: ${template}`);
    } catch (error) {
      console.error(`[Notification] FAILED to add job to queue: ${template} to ${to}`, error);
    }
  }

  async sendWelcomeHr(to: string, hrName: string, companyName: string, inviteLink: string, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? 'Wellbeing Platformuna Hoş Geldiniz' : 'Welcome to Wellbeing Platform';
    
    console.log(`[Notification] Preparing welcome_hr email for: ${to}`);
    await this.addToQueue('welcome_hr', to, subject, {
      hr_name: hrName,
      company_name: companyName,
      platform_url: platformUrl,
      invite_link: inviteLink,
    }, language);
  }

  async sendPasswordReset(to: string, userName: string, resetToken: string, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? 'Şifre Sıfırlama' : 'Password Reset';
    const resetLink = `${platformUrl}/reset-password?token=${resetToken}`;
    const expiresIn = language === 'tr' ? '1 saat' : '1 hour';

    await this.addToQueue('password_reset', to, subject, {
      user_name: userName,
      reset_link: resetLink,
      expires_in: expiresIn,
    }, language);
  }

  async sendSurveyTokenInvite(to: string, fullName: string, companyName: string, surveyTitle: string, token: string, dueDate: Date, language: string = 'tr', logId?: string) {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? '🌱 Wellbeing Anketiniz Hazır' : '🌱 Your Wellbeing Survey is Ready';
    
    const surveyLink = logId 
      ? `${platformUrl}/api/v1/track/click/${logId}`
      : `${platformUrl}/surveys/${token}`;

    const variables: Record<string, string> = {
      full_name: fullName,
      company_name: companyName,
      survey_title: surveyTitle,
      survey_link: surveyLink,
      due_date: dueDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
      estimated_minutes: '5',
    };

    await this.addToQueue('survey_token_invite', to, subject, variables, language);
  }

  async sendCampaignInvite(to: string, fullName: string, companyName: string, surveyTitle: string, surveyLink: string, dueDate: Date, language: string = 'tr') {
    const subject = language === 'tr' ? `📋 Wellbeing Anketi — ${surveyTitle}` : `📋 Wellbeing Survey — ${surveyTitle}`;
    
    await this.addToQueue('campaign_invite', to, subject, {
      full_name: fullName,
      company_name: companyName,
      survey_title: surveyTitle,
      survey_link: surveyLink,
      due_date: dueDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
    }, language);
  }

  async sendCampaignReminder(to: string, fullName: string, companyName: string, surveyTitle: string, surveyLink: string, daysRemaining: number, language: string = 'tr') {
    const subject = language === 'tr' ? '⏰ Hatırlatma: Anketinizi Tamamlayın' : '⏰ Reminder: Complete Your Survey';
    
    await this.addToQueue('campaign_reminder', to, subject, {
      full_name: fullName,
      company_name: companyName,
      survey_title: surveyTitle,
      survey_link: surveyLink,
      days_remaining: daysRemaining.toString(),
    }, language);
  }

  async sendEmployeeInvite(to: string, fullName: string, companyName: string, inviteToken: string, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? 'Wellbeing Hesabınızı Oluşturun' : 'Create Your Wellbeing Account';
    const inviteLink = `${platformUrl}/invite?token=${inviteToken}`;
    const expiresIn = language === 'tr' ? '72 saat' : '72 hours';
    await this.addToQueue('employee_invite', to, subject, {
      full_name: fullName,
      company_name: companyName,
      invite_link: inviteLink,
      expires_in: expiresIn,
    }, language);
  }

  async sendSurveyReminder(to: string, fullName: string, surveyTitle: string, surveyLink: string, daysRemaining: number, language: string = 'tr') {
    const subject = language === 'tr' ? '⏰ Anketinizi Tamamlamayı Unutmayın' : "⏰ Don't Forget to Complete Your Survey";
    await this.addToQueue('survey_reminder', to, subject, {
      full_name: fullName,
      survey_title: surveyTitle,
      survey_link: surveyLink,
      days_remaining: daysRemaining.toString(),
    }, language);
  }

  async sendSurveyClosed(hrEmail: string, hrName: string, companyName: string, period: string, participationRate: number, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? `📊 ${period} Wellbeing Sonuçları Hazır` : `📊 ${period} Wellbeing Results are Ready`;
    const dashboardLink = `${platformUrl}/dashboard`;
    await this.addToQueue('survey_closed', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      period,
      dashboard_link: dashboardLink,
      participation_rate: participationRate.toString(),
    }, language);
  }

  async sendScoreAlert(hrEmail: string, hrName: string, companyName: string, dimension: string, score: number, previousScore: number | null, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? '⚠️ Düşük Wellbeing Skoru Uyarısı' : '⚠️ Low Wellbeing Score Alert';
    const dashboardLink = `${platformUrl}/dashboard`;
    const translatedDimension = DimensionLabels[language as 'tr' | 'en']?.[dimension] || dimension;
    await this.addToQueue('score_alert', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      dimension: translatedDimension,
      score: score.toString(),
      previous_score: previousScore?.toString() || '-',
      dashboard_link: dashboardLink,
    }, language);
  }

  async sendAiReady(hrEmail: string, hrName: string, companyName: string, period: string, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? `🤖 AI Analizi Hazır — ${period}` : `🤖 AI Analysis Ready — ${period}`;
    const dashboardLink = `${platformUrl}/dashboard`;
    await this.addToQueue('ai_ready', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      period,
      dashboard_link: dashboardLink,
    }, language);
  }

  async sendPlanExpiry(contactEmail: string, companyName: string, daysRemaining: number, planName: string) {
    const subject = `⚠️ Aboneliğiniz ${daysRemaining} Gün İçinde Bitiyor`;
    await this.addToQueue('plan_expiry', contactEmail, subject, {
      company_name: companyName,
      days_remaining: daysRemaining.toString(),
      plan_name: planName,
      contact_email: contactEmail,
    }, 'tr');
  }

  async sendReportReady(hrEmail: string, hrName: string, companyName: string, period: string, format: string, downloadLink: string, language: string = 'tr') {
    const subject = language === 'tr' ? '📑 Raporunuz İndirilmeye Hazır' : '📑 Your Report is Ready for Download';
    const expiresIn = language === 'tr' ? '15 dakika' : '15 minutes';
    await this.addToQueue('report_ready', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      period,
      format,
      download_link: downloadLink,
      expires_in: expiresIn,
    }, language);
  }

  async sendDraftReminder(to: string, fullName: string, surveyTitle: string, surveyLink: string, dueDate: Date, language: string = 'tr') {
    const subject = language === 'tr' ? '📝 Yarım Kalan Anketiniz Sizi Bekliyor' : '📝 Your Incomplete Survey is Waiting';
    await this.addToQueue('draft_reminder', to, subject, {
      full_name: fullName,
      survey_title: surveyTitle,
      survey_link: surveyLink,
      due_date: dueDate.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US'),
    }, language);
  }

  async sendReportFailed(hrEmail: string, hrName: string, companyName: string, period: string, format: string, language: string = 'tr') {
    const settings = await this.settingsService.getSettings();
    const subject = language === 'tr' ? '❌ Rapor Oluşturulamadı' : '❌ Report Generation Failed';
    await this.addToQueue('report_failed', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      period,
      format,
      support_email: settings?.mail_from_address || 'destek@wellbeingmetric.com',
    }, language);
  }

  async sendCampaignBounced(hrEmail: string, hrName: string, companyName: string, bouncedCount: number, dashboardLink: string, language: string = 'tr') {
    const subject = language === 'tr' ? '⚠️ Teslim Edilemeyen Mailler' : '⚠️ Undelivered Emails';
    await this.addToQueue('campaign_bounced', hrEmail, subject, {
      hr_name: hrName,
      company_name: companyName,
      bounced_count: bouncedCount.toString(),
      dashboard_link: dashboardLink,
    }, language);
  }

  async sendDemoRequest(adminEmail: string, data: any) {
    const subject = `Yeni Demo Talebi: ${data.company_name}`;
    await this.addToQueue('demo_request', adminEmail, subject, {
      full_name: data.full_name,
      email: data.email,
      company_name: data.company_name,
      company_size: data.company_size || '-',
      industry: data.industry || '-',
      message: data.message || '-',
    }, 'tr');
  }

  async sendSubscriptionExpired(to: string, fullName: string, plan: string, language: string = 'tr') {
    const subject = language === 'tr' ? '⚠️ Aboneliğiniz Sona Erdi' : '⚠️ Your Subscription Has Expired';
    await this.addToQueue('subscription_expired', to, subject, {
      full_name: fullName,
      plan: plan,
    }, language);
  }

  async sendConsultantWelcome(to: string, fullName: string, inviteToken: string, language: string = 'tr') {
    const platformUrl = await this.getPlatformUrl();
    const subject = language === 'tr' ? 'Eğitmen Hesabınızı Oluşturun' : 'Create Your Consultant Account';
    const inviteLink = `${platformUrl}/invite?token=${inviteToken}`;
    const expiresIn = language === 'tr' ? '48 saat' : '48 hours';
    
    await this.addToQueue('consultant_invite', to, subject, {
      full_name: fullName,
      invite_link: inviteLink,
      expires_in: expiresIn,
    }, language);
  }

  // Generic sendEmail for backward compatibility
  async sendEmail(to: string, template: string, variables: Record<string, any>) {
      const language = variables.language || 'tr';
      const subject = variables.subject || 'Wellbeing Platform Bildirimi';
      await this.addToQueue(template, to, subject, variables, language);
  }
}
