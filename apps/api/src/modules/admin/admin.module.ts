import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSurveyPoolService } from './admin-survey-pool.service';
import { AdminSurveyPoolController } from './admin-survey-pool.controller';
import { Survey } from '../survey/entities/survey.entity';
import { User } from '../user/entities/user.entity';
import { AdminSecurityController } from './admin-security.controller';
import { BruteForceService } from '../auth/brute-force.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, User]),
  ],
  controllers: [
    AdminSurveyPoolController,
    AdminSecurityController,
  ],
  providers: [
    AdminSurveyPoolService,
    BruteForceService,
  ],
  exports: [
    AdminSurveyPoolService,
  ],
})
export class AdminModule {}
