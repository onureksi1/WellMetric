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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ConsultantGuard } from '../../common/guards/consultant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrainingService } from './training.service';
import { CreateTrainingPlanDto, UpdateTrainingPlanDto, CreateTrainingEventDto, UpdateTrainingEventDto } from './dto/training.dto';

@Controller('consultant/training')
@UseGuards(JwtAuthGuard, ConsultantGuard)
export class ConsultantTrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('plans')
  findPlans(@CurrentUser() user: any, @Query('company_id') companyId?: string) {
    return this.trainingService.findPlans(user.id, companyId);
  }

  @Get('plans/:id')
  findOnePlan(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.findOnePlan(id, user.id);
  }

  @Post('plans')
  createPlan(@Body() dto: CreateTrainingPlanDto, @CurrentUser() user: any) {
    return this.trainingService.createPlan(dto, user.id);
  }

  @Put('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateTrainingPlanDto, @CurrentUser() user: any) {
    return this.trainingService.updatePlan(id, dto, user.id);
  }

  @Post('plans/:id/publish')
  publishPlan(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.publishPlan(id, user.id);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.deletePlan(id, user.id);
  }

  @Post('plans/:planId/events')
  addEvent(@Param('planId') planId: string, @Body() dto: CreateTrainingEventDto, @CurrentUser() user: any) {
    return this.trainingService.addEvent(planId, dto, user.id);
  }

  @Put('events/:id')
  updateEvent(@Param('id') id: string, @Body() dto: UpdateTrainingEventDto, @CurrentUser() user: any) {
    return this.trainingService.updateEvent(id, dto, user.id);
  }

  @Delete('events/:id')
  deleteEvent(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.deleteEvent(id, user.id);
  }

  @Get('content/:contentId/engagement')
  getEngagement(@Param('contentId') contentId: string, @CurrentUser() user: any) {
    return this.trainingService.getContentEngagement(contentId, user.id);
  }
}
