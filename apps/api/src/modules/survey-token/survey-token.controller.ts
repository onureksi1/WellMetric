import { Controller, Get, Param } from '@nestjs/common';
import { SurveyTokenService } from './survey-token.service';

@Controller('public/survey-tokens')
export class SurveyTokenController {
  constructor(private readonly surveyTokenService: SurveyTokenService) {}

  @Get(':token')
  async validateToken(@Param('token') token: string) {
    return this.surveyTokenService.validateToken(token);
  }
}
