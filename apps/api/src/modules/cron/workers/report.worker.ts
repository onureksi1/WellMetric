import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ReportProcessor } from '../../report/report.processor';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class ReportWorker implements OnModuleInit {
  private readonly logger = new Logger(ReportWorker.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const processor = this.moduleRef.get(ReportProcessor, { strict: false });
    
    new Worker('report-queue', async (job) => {
      return (processor as any).handleGenerate(job as any);
    }, {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      },
      concurrency: 1,
      lockDuration: 300000, // 5 mins
    });

    this.logger.log('Report Worker initialized on report-queue (Sequential)');
  }
}
