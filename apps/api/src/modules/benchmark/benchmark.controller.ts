import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { BenchmarkService } from './benchmark.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateBenchmarkDto } from './dto/update-benchmark.dto';

@Controller()
export class BenchmarkController {
  constructor(private readonly benchmarkService: BenchmarkService) {}

  // HR Dashboard — firmanın benchmark karşılaştırması
  @Get('hr/dashboard/benchmark')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getForCompany(
    @CurrentUser() user: any,
    @Query('period') period: string,
  ) {
    const p = period ?? new Date().toISOString().slice(0, 7); // '2026-05'
    return this.benchmarkService.getBenchmarkForCompany(user.company_id, p);
  }

  // Admin — tüm benchmark'ları listele
  @Get('admin/benchmarks')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(@Query('industry') industry?: string) {
    return this.benchmarkService.findAll(industry);
  }

  // Admin — tek değer güncelle
  @Put('admin/benchmarks')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Body() dto: UpdateBenchmarkDto, @CurrentUser() user: any) {
    return this.benchmarkService.updateBenchmark(
      dto.industry, dto.region, dto.dimension,
      dto.score, dto.source, user.id,
    );
  }

  // Admin — seed'e sıfırla
  @Patch('admin/benchmarks/:id/reset')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reset(@Param('id') id: string) {
    return this.benchmarkService.resetBenchmark(id);
  }
}
