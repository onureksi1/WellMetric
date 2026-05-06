import { Resend } from 'resend';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class ResendProvider implements IMailProvider {
  private client: Resend;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Resend(apiKey);
    console.log('[ResendProvider] Initialized');
  }

  async send(options: MailOptions): Promise<any> {
    console.log('[ResendProvider] Sending to:', options.to);
    const cleanKey = this.apiKey.trim();
    
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: options.from_name
          ? `${options.from_name} <${options.from}>`
          : (options.from || 'noreply@wellanalytics.io'),
        to: options.to,
        subject: options.subject,
        html: options.html,
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[ResendProvider] Error:', errBody);
      throw new Error(`Resend error: ${errBody}`);
    }

    const data: any = await res.json();
    
    // Extract headers for synchronization
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });

    console.log('[ResendProvider] Sent successfully. ID:', data.id);
    
    return {
      success: true,
      messageId: data.id,
      headers // Pass headers back for auto-sync in NotificationService
    };
  }

  async getQuota() {
    try {
      if (!this.apiKey) return null;

      console.log('[ResendProvider] Fetching quota via headers from /emails...');
      const cleanKey = this.apiKey.trim();
      const res = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        console.error(`[ResendProvider] domains API Error (${res.status})`);
        return { success: false, message: `Hata: ${res.status}` };
      }

      // Read quotas from headers as per official docs
      console.log('--- ALL RESEND RESPONSE HEADERS ---');
      res.headers.forEach((value, name) => {
        console.log(`${name}: ${value}`);
      });
      console.log('-----------------------------------');

      const dailyQuota = res.headers.get('x-resend-daily-quota');
      const monthlyQuota = res.headers.get('x-resend-monthly-quota');
      const rateLimitLimit = res.headers.get('ratelimit-limit');
      const rateLimitRemaining = res.headers.get('ratelimit-remaining');

      // If we have monthly quota, use it, otherwise fallback to daily or rate limit
      const total = parseInt(monthlyQuota || dailyQuota || rateLimitLimit || '0');
      const remaining = parseInt(rateLimitRemaining || '0');

      return {
        success: true,
        remaining: remaining || total,
        total: total
      };
    } catch (err) {
      console.error('[ResendProvider] Quota fetch unexpected error:', err.message);
      return { success: false, message: 'İstek Hatası' };
    }
  }
}
