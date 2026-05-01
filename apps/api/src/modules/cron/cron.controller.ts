import { Controller, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CronService } from './cron.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('Admin / Cron')
@Controller('api/v1/admin/cron')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CronController {
  constructor(
    private readonly cronService: CronService,
    @InjectQueue('score-queue') private readonly scoreQueue: Queue,
  ) {}

  @Post('trigger-survey')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Manually trigger monthly global survey' })
  async triggerSurvey() {
    await this.cronService.triggerGlobalSurvey();
    return { success: true, message: 'Global survey trigger initiated.' };
  }

  @Post('recalculate-scores')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Manually trigger score recalculation' })
  async recalculateScores(@Body() dto: { company_id?: string; survey_id?: string; period?: string }) {
    if (dto.company_id && dto.survey_id && dto.period) {
      await this.scoreQueue.add('recalculate', {
        companyId: dto.company_id,
        surveyId: dto.survey_id,
        period: dto.period
      });
      return { success: true, message: 'Score recalculation job added to queue.' };
    }
    await this.cronService.recalculateScores();
    return { success: true, message: 'Global score recalculation process initiated.' };
  }

  @Post('close-survey')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Manually trigger survey closing process' })
  async closeSurvey() {
    await this.cronService.closeMonthlySurvey();
    return { success: true, message: 'Survey closing process initiated.' };
  }

  @Post('trend-analysis')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Manually trigger trend analysis' })
  async triggerTrend() {
    await this.cronService.generateTrendAnalysis();
    return { success: true, message: 'Trend analysis process initiated.' };
  }
}
