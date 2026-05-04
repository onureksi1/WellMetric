import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { PublicSurveyService } from './public-survey.service';

@Controller('public-survey')
export class PublicSurveyController {
  constructor(private readonly surveyService: PublicSurveyService) {}

  @Get(':token')
  async getByToken(@Param('token') token: string) {
    const data = await this.surveyService.getByToken(token);
    return { data };
  }

  @Post(':token/submit')
  async submit(
    @Param('token') token: string,
    @Body() dto: { answers: any[] },
    @Req() req: Request,
  ) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return this.surveyService.submit(token, dto.answers, ip);
  }
}
