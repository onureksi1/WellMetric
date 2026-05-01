import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { ScoreProcessor } from '../../score/score.processor';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class ScoreWorker implements OnModuleInit {
  private readonly logger = new Logger(ScoreWorker.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    const processor = this.moduleRef.get(ScoreProcessor, { strict: false });
    
    new Worker('score-queue', async (job) => {
      return (processor as any).handleCalculate(job as any);
    }, {
      connection: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
      },
      concurrency: 3,
    });

    this.logger.log('Score Worker initialized on score-queue (Concurrency: 3)');
  }
}
