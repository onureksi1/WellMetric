import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { CronLockGuard } from './guards/cron-lock.guard';
import { AIWorker } from './workers/ai.worker';
import { MailWorker } from './workers/mail.worker';
import { ReportWorker } from './workers/report.worker';
import { ScoreWorker } from './workers/score.worker';
import { ScoreModule } from '../score/score.module';
import { AIModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { SurveyModule } from '../survey/survey.module';
import { UserModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { CampaignModule } from '../campaign/campaign.module';
import { BillingModule } from '../billing/billing.module';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue(
      { name: 'ai-queue' },
      { name: 'mail-queue' },
      { name: 'report-queue' },
      { name: 'score-queue' },
    ),
    ScoreModule,
    AIModule,
    NotificationModule,
    AuditModule,
    SurveyModule,
    UserModule,
    CompanyModule,
    CampaignModule,
    BillingModule,
    TrainingModule,
  ],
  controllers: [CronController],
  providers: [
    CronService,
    CronLockGuard,
    AIWorker,
    MailWorker,
    ReportWorker,
    ScoreWorker,
  ],
  exports: [CronService],
})
export class CronModule {}
