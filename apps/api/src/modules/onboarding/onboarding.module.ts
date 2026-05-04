import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingAssignment } from './entities/onboarding-assignment.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { User } from '../user/entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { SurveyTokenModule } from '../survey-token/survey-token.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnboardingAssignment,
      User,
      Company,
      Survey,
      SurveyQuestion,
      ResponseAnswer,
    ]),
    SurveyTokenModule,
    SettingsModule,
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
