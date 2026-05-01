import * as nodemailer from 'nodemailer';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class SmtpProvider implements IMailProvider {
  constructor(private config: any) {}

  async send(options: MailOptions): Promise<void> {
    const { host, port, user, password, secure } = this.config;

    console.log('[SmtpProvider] Config:', {
      host,
      port,
      user,
      secure,
      hasPassword: !!password
    });

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for 465, false for 587
      auth: { user, pass: password },
      tls: {
        rejectUnauthorized: false // self-signed cert support
      }
    });

    // Connection verification
    try {
      await transporter.verify();
      console.log('[SmtpProvider] Connection verified');
    } catch (err) {
      console.error('[SmtpProvider] Verify failed:', err.message);
      throw new Error(`SMTP bağlantı hatası: ${err.message}`);
    }

    const fromAddr = options.from || user;
    const fromName = options.from_name || 'Wellbeing';

    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('[SmtpProvider] Sent:', result.messageId);
  }
}
