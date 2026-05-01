import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { ReportProcessor } from './report.processor';
import { LogoHelper } from './helpers/logo.helper';
import { ScoreModule } from '../score/score.module';
import { AIModule } from '../ai/ai.module';
import { ActionModule } from '../action/action.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'report-queue',
    }),
    ScoreModule,
    forwardRef(() => AIModule),
    ActionModule,
    NotificationModule,
    AuditModule,
    SettingsModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    ReportProcessor,
    LogoHelper,
  ],
  exports: [ReportService],
})
export class ReportModule {}
