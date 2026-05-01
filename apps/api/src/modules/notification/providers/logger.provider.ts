import { Logger } from '@nestjs/common';
import { IMailProvider, MailOptions } from './mail-provider.interface';

export class LoggerProvider implements IMailProvider {
  private readonly logger = new Logger(LoggerProvider.name);

  async send(options: MailOptions): Promise<void> {
    this.logger.log('--- MAIL PREVIEW (LOGGER) ---');
    this.logger.log(`TO: ${options.to}`);
    this.logger.log(`SUBJECT: ${options.subject}`);
    this.logger.log(`FROM: ${options.from_name} <${options.from}>`);
    this.logger.log('--- CONTENT START ---');
    this.logger.log(options.html);
    this.logger.log('--- CONTENT END ---');
  }
}
