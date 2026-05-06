import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrainingService } from './training.service';
import { SendNotificationDto } from './dto/training.dto';

@Controller('hr/training')
@UseGuards(JwtAuthGuard, TenantGuard)
export class HrTrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('plans')
  findPlans(@CurrentUser() user: any) {
    return this.trainingService.findPlansForCompany(user.company_id);
  }

  @Get('plans/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.trainingService.findOnePlanForHr(id, user.company_id);
  }

  @Patch('events/:id/complete')
  markComplete(@Param('id') id: string, @Body() dto: { notes?: string }, @CurrentUser() user: any) {
    return this.trainingService.markEventCompleted(id, user.company_id, dto, user.id);
  }

  @Post('events/:id/notify')
  sendNotification(@Param('id') id: string, @Body() dto: SendNotificationDto, @CurrentUser() user: any) {
    return this.trainingService.sendEventNotification(id, user.company_id, dto, user.id);
  }

  @Post('content/:contentId/log')
  logEngagement(@Param('contentId') contentId: string, @Body() body: any, @CurrentUser() user: any, @Req() req: any) {
    return this.trainingService.logEngagement({
      contentItemId: contentId,
      trainingEventId: body.training_event_id,
      companyId: user.company_id,
      userId: user.id,
      action: body.action || 'click',
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }
}
