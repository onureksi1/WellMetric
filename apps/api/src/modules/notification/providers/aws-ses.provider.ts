import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class AwsSesProvider implements IMailProvider {
  private client: SESClient;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.client = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    console.log('[AwsSesProvider] Initialized');
  }

  async send(options: MailOptions): Promise<void> {
    console.log('[AwsSesProvider] Sending to:', options.to);

    const from = options.from_name 
      ? `${options.from_name} <${options.from || 'noreply@wellanalytics.io'}>`
      : (options.from || 'noreply@wellanalytics.io');

    const command = new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: { Data: options.subject },
        Body: {
          Html: { Data: options.html },
        },
      },
    });

    try {
      await this.client.send(command);
      console.log('[AwsSesProvider] Sent successfully');
    } catch (error) {
      console.error('[AwsSesProvider] Error:', error);
      throw new Error(`AWS SES error: ${error.message}`);
    }
  }
}
