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
    ]),
    AIModule,
    forwardRef(() => CompanyModule),
  ],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
