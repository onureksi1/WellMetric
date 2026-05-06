import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionCampaign } from './entities/distribution-campaign.entity';
import { DistributionLog } from './entities/distribution-log.entity';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { AdminCampaignController } from './admin-campaign.controller';
import { TrackingController } from './tracking.controller';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { User } from '../user/entities/user.entity';
import { Employee } from '../user/entities/employee.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DistributionCampaign,
      DistributionLog,
      SurveyToken,
      User,
      Employee,
    ]),
    AuditModule,
    NotificationModule,
    SettingsModule,
  ],
  controllers: [CampaignController, AdminCampaignController, TrackingController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
