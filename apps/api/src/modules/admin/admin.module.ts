import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSurveyPoolService } from './admin-survey-pool.service';
import { AdminSurveyPoolController } from './admin-survey-pool.controller';
import { Survey } from '../survey/entities/survey.entity';
import { User } from '../user/entities/user.entity';
import { AdminSecurityController } from './admin-security.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { BruteForceService } from '../auth/brute-force.service';
import { AIModule } from '../ai/ai.module';
import { ExchangeRateService } from '../../common/utils/exchange-rate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, User]),
    AIModule,
  ],
  controllers: [
    AdminSurveyPoolController,
    AdminSecurityController,
    AdminAnalyticsController,
  ],
  providers: [
    AdminSurveyPoolService,
    BruteForceService,
    ExchangeRateService,
  ],
  exports: [
    AdminSurveyPoolService,
  ],
})
export class AdminModule {}
