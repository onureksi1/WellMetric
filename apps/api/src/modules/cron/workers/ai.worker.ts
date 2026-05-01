import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AIProcessor } from '../../ai/ai.processor';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AIWorker implements OnModuleInit {
  private readonly logger = new Logger(AIWorker.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const processor = this.moduleRef.get(AIProcessor, { strict: false });
    
    new Worker('ai-queue', async (job) => {
      // Direct call to processor method based on job name
      switch (job.name) {
        case 'open_text_summary':
          return (processor as any).handleOpenTextSummary(job as any);
        case 'risk_alert':
          return (processor as any).handleRiskAlert(job as any);
        case 'trend_analysis':
          return (processor as any).handleTrendAnalysis(job as any);
        case 'admin_anomaly':
          return (processor as any).handleAdminAnomaly(job as any);
      }
    }, {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      },
      concurrency: 2,
    });

    this.logger.log('AI Worker initialized on ai-queue');
  }
}
