import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailProviderFactory } from './providers/mail-provider.factory';
import { MailTemplateService } from './mail-template.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreditService } from '../billing/services/credit.service';

export interface MailJobData {
  template: string;
  to: string;
  subject: string;
  variables: Record<string, string>;
  language: string;
  companyId?: string;
  consultantId?: string;
}

@Processor('mail-queue')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly providerFactory: MailProviderFactory,
    private readonly mailTemplateService: MailTemplateService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    private readonly creditService: CreditService,
  ) {}

  @Process('send_mail')
  async handleSendMail(job: Job<MailJobData>) {
    const { template, to, subject, variables, language, companyId, consultantId } = job.data;
    console.log(`[MailProcessor] Processing job: ${job.id} | Template: ${template} to: ${to}`);

    try {
      // 1. Render Template from DB/Cache
      const html = await this.mailTemplateService.render(template, language, variables);
      console.log(`[MailProcessor] Template rendered successfully, length: ${html.length}`);

      // 2. Get Provider
      const provider = await this.providerFactory.getProvider();
      console.log(`[MailProcessor] Using provider: ${provider.constructor.name}`);

      // 3. Get Platform Settings for From Address
      const settings = await this.settingsService.getSettings();
      const from = settings?.mail_from_address || 'no-reply@mg.wellbeingmetric.com';
      const fromName = settings?.mail_from_name || 'Wellbeing Metric';

      // 4. Send
      await provider.send({
        to,
        subject,
        html,
        from,
        from_name: fromName,
      });

      console.log(`[MailProcessor] Email sent successfully to: ${to}`);

      // 5. Deduct Credit (1 mail_credit per send)
      if (consultantId) {
        await this.creditService.deductCredits(
          consultantId,
          'mail_credit',
          1,
          `E-posta Gönderimi: ${template}`,
          companyId
        );
      }

    } catch (error) {
      console.error(`[MailProcessor] FAILED: ${error.message}`, error.stack);
      
      if (job.attemptsMade >= 2) { // Final attempt failed
        await this.auditService.logAction(
          'system',
          null,
          'mail.failed',
          'notifications',
          null,
          { template, to, error: error.message }
        );
      }
      
      throw error; // Trigger Bull retry
    }
  }
}
