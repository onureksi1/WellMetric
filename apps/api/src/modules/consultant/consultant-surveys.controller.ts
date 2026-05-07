import { Controller, Get, Post, Put, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { ConsultantSurveyOwnershipGuard } from '../../common/guards/consultant-survey-ownership.guard';
import { ConsultantSurveysService } from './consultant-surveys.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateConsultantSurveyDto } from './dto/create-consultant-survey.dto';
import { UpdateConsultantSurveyDto } from './dto/update-consultant-survey.dto';
import { AssignConsultantSurveyDto } from './dto/assign-consultant-survey.dto';
import { AiGenerateSurveyDto } from '../survey/dto/ai-generate-survey.dto';
import { AIService } from '../ai/ai.service';

@Controller('consultant/surveys')
@UseGuards(JwtAuthGuard, ConsultantGuard)
export class ConsultantSurveysController {
  constructor(
    private readonly surveysService: ConsultantSurveysService,
    private readonly aiService: AIService,
  ) {}

  @Get('draft')
  getDraft(@CurrentUser() user: any) {
    return this.surveysService.getDraft(user.consultant_id);
  }

  @Put('draft')
  saveDraft(@Body() body: any, @CurrentUser() user: any) {
    return this.surveysService.saveDraft(body, user.consultant_id);
  }

  @Delete('draft')
  deleteDraft(@CurrentUser() user: any) {
    return this.surveysService.deleteDraft(user.consultant_id);
  }

  @Post('ai-generate')
  aiGenerate(@Body() dto: AiGenerateSurveyDto, @CurrentUser() user: any) {
    console.log('[DEBUG] ConsultantSurveysController.aiGenerate started', {
      industry: dto.industry,
      dimensions: dto.dimensions,
      count: dto.question_count,
      lang: dto.language,
      consultant_id: user.consultant_id
    });
    return this.aiService.generateSurveyQuestions(dto);
  }

  @Post('assign')
  assign(@Body() dto: AssignConsultantSurveyDto, @CurrentUser() user: any) {
    return this.surveysService.assign(dto, user.consultant_id);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.surveysService.findAll(user.consultant_id);
  }

  @Post()
  create(@Body() dto: CreateConsultantSurveyDto, @CurrentUser() user: any) {
    return this.surveysService.create(dto, user.consultant_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveysService.findOne(id, user.consultant_id);
  }

  @Put(':id')
  @UseGuards(ConsultantSurveyOwnershipGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConsultantSurveyDto,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.update(id, dto, user.consultant_id);
  }

  @Delete(':id')
  @UseGuards(ConsultantSurveyOwnershipGuard)
  remove(@Param('id') id: string) {
    return this.surveysService.remove(id);
  }

  @Patch(':id/pool-visibility')
  @UseGuards(ConsultantSurveyOwnershipGuard)
  async setPoolVisibility(
    @Param('id') id: string,
    @Body('is_pool_visible') visible: boolean,
    @CurrentUser() user: any,
  ) {
    await this.surveysService.setPoolVisibility(id, user.consultant_id, visible);
    return { updated: true };
  }
}
