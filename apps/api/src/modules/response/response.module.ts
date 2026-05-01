import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';
import { ResponseAnswerSelection } from './entities/response-answer-selection.entity';
import { DraftResponse } from './entities/draft-response.entity';
import { SurveyThrottle } from './entities/survey-throttle.entity';
import { DistributionLog } from '../campaign/entities/distribution-log.entity';
import { DistributionCampaign } from '../campaign/entities/distribution-campaign.entity';

import { ResponseService } from './response.service';
import { ResponseController } from './response.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyResponse,
      ResponseAnswer,
      ResponseAnswerSelection,
      DraftResponse,
      SurveyThrottle,
      DistributionLog,
      DistributionCampaign,
    ]),
  ],
  controllers: [ResponseController],
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseModule {}
