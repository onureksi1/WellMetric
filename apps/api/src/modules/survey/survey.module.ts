import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';

import { Survey } from './entities/survey.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { SurveyQuestionOption } from './entities/survey-question-option.entity';
import { SurveyQuestionRow } from './entities/survey-question-row.entity';
import { SurveyAssignment } from './entities/survey-assignment.entity';
import { Company } from '../company/entities/company.entity';
import { CompanyModule } from '../company/company.module';
import { SurveyDraft } from './entities/survey-draft.entity';
import { AIModule } from '../ai/ai.module';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { PublicSurveyController } from './public-survey.controller';
import { PublicSurveyService } from './public-survey.service';
import { CampaignModule } from '../campaign/campaign.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Survey,
      SurveyQuestion,
      SurveyQuestionOption,
      SurveyQuestionRow,
      SurveyAssignment,
      Company,
      SurveyDraft,
      SurveyToken,
      SurveyResponse,
      ResponseAnswer,
    ]),
    AIModule,
    forwardRef(() => CompanyModule),
    CampaignModule,
  ],
  controllers: [SurveyController, PublicSurveyController],
  providers: [SurveyService, PublicSurveyService],
  exports: [SurveyService, PublicSurveyService],
})
export class SurveyModule {}
