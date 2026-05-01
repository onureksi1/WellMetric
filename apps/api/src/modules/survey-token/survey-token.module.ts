import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyToken } from './entities/survey-token.entity';
import { SurveyTokenService } from './survey-token.service';
import { SurveyTokenController } from './survey-token.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SurveyToken])],
  controllers: [SurveyTokenController],
  providers: [SurveyTokenService],
  exports: [SurveyTokenService],
})
export class SurveyTokenModule {}
