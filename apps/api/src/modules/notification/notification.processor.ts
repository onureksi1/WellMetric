import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailProviderFactory } from './providers/mail-provider.factory';
import { MailTemplateService } from './mail-template.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { CreditService } from '../billing/services/credit.service';
import { WhiteLabelService } from '../white-label/white-label.service';

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
    private readonly whiteLabelService: WhiteLabelService,
  ) {}

  @Process('send_mail')
  async handleSendMail(job: Job<MailJobData>) {
    const { template, to, subject, variables, language, companyId, consultantId } = job.data;
    console.log(`[MailProcessor] Processing job: ${job.id} | Template: ${template} to: ${to}`);

    try {
      // 1. Get Platform Settings for From Address
      const [settings, provider] = await Promise.all([
        this.settingsService.getSettings(),
        this.providerFactory.getProvider(),
      ]);
      const from = settings?.mail_from_address || 'no-reply@mg.wellbeingmetric.com';
      let fromName = settings?.mail_from_name || 'Wellbeing Metric';

      // 2. Apply white label branding before rendering so brand vars are in the template
      const platformUrl = process.env.NEXT_PUBLIC_APP_URL || settings?.platform_url || 'https://app.wellbeingmetric.com';
      let brandLogoUrl = settings?.platform_logo_url || `${platformUrl}/images/logo.png`;
      
      // If logo URL is relative, prepend platform URL
      if (brandLogoUrl.startsWith('/')) {
        brandLogoUrl = `${platformUrl}${brandLogoUrl}`;
      }

      // Convert logo to base64 if it's a localhost URL to ensure it shows up in emails
      let embeddedLogo = brandLogoUrl;
      try {
        if (brandLogoUrl.includes('localhost') || brandLogoUrl.includes('127.0.0.1')) {
          const axios = require('axios');
          const response = await axios.get(brandLogoUrl, { responseType: 'arraybuffer' });
          const contentType = response.headers['content-type'] || 'image/png';
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          embeddedLogo = `data:${contentType};base64,${base64}`;
          console.log(`[MailProcessor] Logo embedded as base64 (${contentType})`);
        }
      } catch (e) {
        console.warn(`[MailProcessor] Could not embed logo: ${e.message}`);
      }

      const mergedVars = { 
        ...variables, 
        platform_url: platformUrl,
        brand_logo_url: embeddedLogo,
        brand_name: settings?.platform_name || 'Wellbeing Metric',
        brand_color: '#2E865A' // Default brand color
      };
      
      if (consultantId) {
        const wlConfig = await this.whiteLabelService.getConfig(consultantId);
        if (wlConfig?.is_active) {
          fromName = wlConfig.brand_name;
          mergedVars['brand_name'] = wlConfig.brand_name;
          if (wlConfig.brand_logo_url) {
            let consultantLogo = wlConfig.brand_logo_url;
            try {
              if (consultantLogo.includes('localhost') || consultantLogo.includes('127.0.0.1')) {
                const axios = require('axios');
                const response = await axios.get(consultantLogo, { responseType: 'arraybuffer' });
                const contentType = response.headers['content-type'] || 'image/png';
                const base64 = Buffer.from(response.data, 'binary').toString('base64');
                consultantLogo = `data:${contentType};base64,${base64}`;
              }
            } catch (e) {}
            mergedVars['brand_logo_url'] = consultantLogo;
          }
          if (wlConfig.brand_color) mergedVars['brand_color'] = wlConfig.brand_color;
        }
      }

      // 3. Render Template from DB/Cache with merged variables
      const html = await this.mailTemplateService.render(template, language, mergedVars);
      console.log(`[MailProcessor] Template rendered successfully, length: ${html.length}`);
      console.log(`[MailProcessor] Using provider: ${provider.constructor.name}`);

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
