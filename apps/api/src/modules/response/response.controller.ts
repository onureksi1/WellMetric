import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ResponseService } from './response.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  // Public endpoint for token-based submission
  @Post('public/survey-tokens/:token/submit')
  async submitTokenMode(@Param('token') token: string, @Body() dto: SubmitResponseDto) {
    return this.responseService.submitTokenMode(token, dto);
  }

  // Protected endpoint for authenticated employee submission
  @UseGuards(JwtAuthGuard)
  @Post('employee/surveys/:id/submit')
  async submitAccountMode(@Param('id') surveyId: string, @Body() dto: SubmitResponseDto, @CurrentUser() user: any) {
    return this.responseService.submitAccountMode(user.id, surveyId, dto);
  }
}
