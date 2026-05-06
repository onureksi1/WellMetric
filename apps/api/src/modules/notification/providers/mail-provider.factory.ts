import { Injectable } from '@nestjs/common';
import { SettingsService } from '../../settings/settings.service';
import { IMailProvider } from './mail-provider.interface';
import { ResendProvider } from './resend.provider';
import { SmtpProvider } from './smtp.provider';
import { SendGridProvider } from './sendgrid.provider';
import { AwsSesProvider } from './aws-ses.provider';

@Injectable()
export class MailProviderFactory {
  constructor(
    private readonly settingsService: SettingsService
  ) {}

  async getProvider(): Promise<IMailProvider> {
    const settings = await this.settingsService.getSettings();
    const provider = settings.mail_provider;
    console.log('[MailFactory] Provider:', provider);

    // mail_config decrypt et
    let config = await this.settingsService.getDecryptedMailConfig();
    
    // Diagnostic logging - yazılabilir bir yere logla
    const logPath = '/Users/onureksi/Desktop/wellanalytics/apps/api/mail_diag.log';
    const logMsg = `[${new Date().toISOString()}] Provider: ${provider} | Config: ${JSON.stringify(config)}\n`;
    try { require('fs').appendFileSync(logPath, logMsg); } catch (e) {}

    // Handle nested structure if still present
    if (config?.provider_specific?.[provider]) {
      config = config.provider_specific[provider];
    }

    switch (provider) {
      case 'resend':
        const apiKey = config?.api_key || config?.apiKey;
        if (!apiKey) {
          throw new Error(`Resend API key missing. Config keys: ${Object.keys(config || {}).join(',')}`);
        }
        return new ResendProvider(apiKey);

      case 'sendgrid':
        if (!config?.api_key)
          throw new Error('SendGrid API key missing');
        return new SendGridProvider(config.api_key);

      case 'aws_ses':
        if (!config?.access_key || !config?.secret_key)
          throw new Error('AWS SES credentials missing');
        return new AwsSesProvider(
          config.access_key,
          config.secret_key,
          config.region || 'us-east-1'
        );

      case 'smtp':
        if (!config?.host || !config?.user || !config?.password)
          throw new Error(
            `SMTP config missing. Got: ${JSON.stringify(Object.keys(config || {}))}`
          );
        return new SmtpProvider({
          host: config.host,
          port: parseInt(config.port) || 587,
          user: config.user,
          password: config.password,
          secure: config.secure === true || config.secure === 'true'
        });

      default:
        console.warn(`[MailFactory] Unknown provider: ${provider}. Falling back to basic logging.`);
        return {
          async send(options) {
            console.log(`[LoggerProvider] WOULD SEND to ${options.to}: ${options.subject}`);
          }
        };
    }
  }
}
