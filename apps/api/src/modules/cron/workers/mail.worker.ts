import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationProcessor } from '../../notification/notification.processor';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class MailWorker implements OnModuleInit {
  private readonly logger = new Logger(MailWorker.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const processor = this.moduleRef.get(NotificationProcessor, { strict: false });
    
    new Worker('mail-queue', async (job) => {
      return (processor as any).handleSendMail(job as any);
    }, {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      },
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    this.logger.log('Mail Worker initialized on mail-queue with rate limit 10/s');
  }
}
