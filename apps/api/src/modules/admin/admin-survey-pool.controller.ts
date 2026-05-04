import { Controller, Get, Query, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminSurveyPoolService } from './admin-survey-pool.service';
import { SurveyPoolFilterDto } from './dto/survey-pool-filter.dto';

@Controller('admin/survey-pool')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminSurveyPoolController {
  constructor(private readonly poolService: AdminSurveyPoolService) {}

  @Get()
  findAll(@Query() filters: SurveyPoolFilterDto) {
    return this.poolService.findAll(filters);
  }

  @Get('stats')
  getStats() {
    return this.poolService.getStats();
  }

  // AI export — JSON indir
  @Get('export')
  async exportForAI(
    @Query() filters: SurveyPoolFilterDto,
    @Res() res: Response,
  ) {
    const data = await this.poolService.exportForAI(filters);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="survey-pool-${Date.now()}.json"`,
    );
    res.send(JSON.stringify(data, null, 2));
  }

  // Tekil anket detayı — salt okunur
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.poolService.findOne(id);
  }
}
