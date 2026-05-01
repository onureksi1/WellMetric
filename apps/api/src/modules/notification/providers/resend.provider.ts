import { Resend } from 'resend';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class ResendProvider implements IMailProvider {
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
    console.log('[ResendProvider] Initialized');
  }

  async send(options: MailOptions): Promise<void> {
    console.log('[ResendProvider] Sending to:', options.to);
    console.log('[ResendProvider] From:', options.from_name, '<' + options.from + '>');

    const { error } = await this.client.emails.send({
      from: options.from_name
        ? `${options.from_name} <${options.from}>`
        : (options.from || 'noreply@wellanalytics.io'),
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('[ResendProvider] Error:', error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('[ResendProvider] Sent successfully');
  }
}
