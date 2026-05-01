import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Patch
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { AssignSurveyDto } from './dto/assign-survey.dto';
import { AiGenerateSurveyDto } from './dto/ai-generate-survey.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  // ------------------------------------------------------------------------
  // SUPER ADMIN ROUTES
  // ------------------------------------------------------------------------

  @Roles('super_admin')
  @Get('admin/surveys')
  findAllAdmin(@Query() filters: SurveyFilterDto) {
    return this.surveyService.findAll(filters);
  }

  @Roles('super_admin')
  @Post('admin/surveys')
  createSurveyAdmin(@Body() dto: CreateSurveyDto, @CurrentUser() user: any) {
    return this.surveyService.createSurvey(dto, user.id);
  }

  @Roles('super_admin')
  @Get('admin/surveys/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.surveyService.findOne(id);
  }

  @Roles('super_admin')
  @Put('admin/surveys/:id')
  updateSurveyAdmin(@Param('id') id: string, @Body() dto: UpdateSurveyDto, @CurrentUser() user: any) {
    return this.surveyService.updateSurvey(id, dto, user.id);
  }

  @Roles('super_admin')
  @Delete('admin/surveys/:id')
  deleteSurveyAdmin(@Param('id') id: string) {
    return this.surveyService.deleteSurvey(id);
  }

  @Roles('super_admin')
  @Post('admin/surveys/:id/questions')
  addQuestionAdmin(@Param('id') id: string, @Body() dto: CreateQuestionDto, @CurrentUser() user: any) {
    return this.surveyService.addQuestion(id, dto, user.id);
  }

  @Roles('super_admin')
  @Put('admin/surveys/:id/questions/:qId')
  updateQuestionAdmin(@Param('id') id: string, @Param('qId') qId: string, @Body() dto: UpdateQuestionDto, @CurrentUser() user: any) {
    return this.surveyService.updateQuestion(id, qId, dto, user.id);
  }

  @Roles('super_admin')
  @Delete('admin/surveys/:id/questions/:qId')
  deleteQuestionAdmin(@Param('id') id: string, @Param('qId') qId: string) {
    return this.surveyService.deleteQuestion(id, qId);
  }

  @Roles('super_admin')
  @Post('admin/surveys/:id/questions/reorder')
  reorderQuestionsAdmin(@Param('id') id: string, @Body() dto: ReorderQuestionsDto) {
    return this.surveyService.reorderQuestions(id, dto);
  }

  @Roles('super_admin')
  @Post('admin/surveys/:id/assign')
  assignSurveyAdmin(@Param('id') id: string, @Body() dto: AssignSurveyDto, @CurrentUser() user: any) {
    return this.surveyService.assignSurvey(id, dto, user.id);
  }

  @Roles('super_admin')
  @Get('admin/surveys/:id/results')
  getResultsAdmin(@Param('id') id: string, @Query('company_id') companyId: string, @Query('period') period?: string) {
    return this.surveyService.findResults(id, companyId, period);
  }

  // ------------------------------------------------------------------------
  // AI & DRAFTS
  // ------------------------------------------------------------------------

  @Roles('super_admin')
  @Post('admin/surveys/ai-generate')
  generateWithAI(@Body() dto: AiGenerateSurveyDto) {
    return this.surveyService.generateWithAI(dto);
  }

  @Roles('super_admin')
  @Get('admin/surveys/draft')
  getDraft(@CurrentUser() user: any) {
    return this.surveyService.getDraft(user.id);
  }

  @Roles('super_admin')
  @Put('admin/surveys/draft') // Using Put for upsert as per v2.8
  saveDraft(@CurrentUser() user: any, @Body() draftData: any) {
    return this.surveyService.saveDraft(user.id, draftData);
  }

  @Roles('super_admin')
  @Delete('admin/surveys/draft')
  deleteDraft(@CurrentUser() user: any) {
    return this.surveyService.deleteDraft(user.id);
  }

  // ------------------------------------------------------------------------
  // HR ADMIN ROUTES
  // ------------------------------------------------------------------------

  @Roles('hr_admin')
  @Get('hr/surveys')
  findAllHrAdmin(@CurrentUser() user: any) {
    return this.surveyService.getCompanySurveys(user.company_id);
  }

  @Roles('hr_admin')
  @Get('hr/surveys/:id/results')
  getResultsHrAdmin(@Param('id') id: string, @Query('period') period: string, @CurrentUser() user: any) {
    return this.surveyService.findResults(id, user.company_id, period);
  }

  @Roles('hr_admin')
  @Get('hr/surveys/:id')
  findOneHrAdmin(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveyService.findOne(id, user.company_id, true);
  }


  // ------------------------------------------------------------------------
  // EMPLOYEE ROUTES
  // ------------------------------------------------------------------------

  @Roles('employee')
  @Get('employee/surveys/pending')
  getPendingSurveys(@CurrentUser() user: any) {
    return this.surveyService.findPendingForUser(user.id, user.company_id);
  }

  @Roles('employee')
  @Get('employee/surveys/history')
  getSurveyHistory(@CurrentUser() user: any) {
    return this.surveyService.findHistoryForUser(user.id);
  }

  @Roles('employee')
  @Get('employee/surveys/:id')
  findOneEmployee(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveyService.findOne(id, user.company_id, true);
  }
}
