import * as sgMail from '@sendgrid/mail';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class SendGridProvider implements IMailProvider {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
    console.log('[SendGridProvider] Initialized');
  }

  async send(options: MailOptions): Promise<void> {
    console.log('[SendGridProvider] Sending to:', options.to);

    try {
      await sgMail.send({
        to: options.to,
        from: options.from_name 
          ? { name: options.from_name, email: options.from || 'noreply@wellanalytics.io' }
          : (options.from || 'noreply@wellanalytics.io'),
        subject: options.subject,
        html: options.html,
      });
      console.log('[SendGridProvider] Sent successfully');
    } catch (error) {
      console.error('[SendGridProvider] Error:', error);
      throw new Error(`SendGrid error: ${error.message}`);
    }
  }
}
