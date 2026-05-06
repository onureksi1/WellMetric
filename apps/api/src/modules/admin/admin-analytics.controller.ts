import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiCostService } from '../ai/api-cost.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ExchangeRateService } from '../../common/utils/exchange-rate.service';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly costService: ApiCostService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  // Genel özet
  @Get('ai-costs')
  getCosts(
    @Query('start')    start?:   string,
    @Query('end')      end?:     string,
    @Query('group_by') groupBy?: string,
  ) {
    return this.costService.getStats({
      startDate: start ? new Date(start) : undefined,
      endDate:   end   ? new Date(end)   : undefined,
      groupBy:   groupBy as any,
    });
  }

  // Bu ay özet
  @Get('ai-costs/summary')
  async getMonthlySummary() {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [summary, byModel, byTask, usdTryRate] = await Promise.all([
      this.costService.getStats({ startDate: start, endDate: end }),
      this.costService.getStats({ startDate: start, endDate: end, groupBy: 'model' }),
      this.costService.getStats({ startDate: start, endDate: end, groupBy: 'task' }),
      this.exchangeRateService.getUsdTry(),
    ]);

    const totalCostUsd = summary?.total_cost_usd || 0;
    const totalRevenueTry = summary?.total_revenue_try || 0;

    return {
      summary: {
        ...summary,
        total_cost_usd: totalCostUsd,
        total_revenue_try: totalRevenueTry,
        total_cost_try:    (totalCostUsd * usdTryRate).toFixed(2),
        gross_margin_try:  (totalRevenueTry - totalCostUsd * usdTryRate).toFixed(2),
        margin_percent:    totalRevenueTry > 0
          ? ((1 - (totalCostUsd * usdTryRate / totalRevenueTry)) * 100).toFixed(1)
          : '0',
        usd_try_rate: usdTryRate,
      },
      by_model: byModel,
      by_task:  byTask,
    };
  }

  // Consultant bazlı
  @Get('ai-costs/consultants/:id')
  getConsultantCosts(
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    return this.costService.getConsultantStats(id, month);
  }

  // Günlük trend (grafik için)
  @Get('ai-costs/daily')
  getDailyTrend(
    @Query('days') days: string = '30',
  ) {
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(days));
    return this.costService.getStats({ startDate: start, endDate: end, groupBy: 'day' });
  }
}
