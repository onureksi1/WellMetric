import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ExportReportDto } from './dto/export-report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Report')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('api/v1/hr/reports/export')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a report export for HR Admin' })
  exportHr(@Req() req: any, @Body() dto: ExportReportDto) {
    return this.reportService.requestExport(req.user.company_id, req.user.id, dto);
  }

  @Post('api/v1/admin/reports/export')
  @Roles('super_admin')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a report export for any company (Super Admin)' })
  exportAdmin(@Req() req: any, @Body() dto: ExportReportDto) {
    if (!dto.company_id) {
      return { status: 'error', message: 'company_id is required for super_admin export.' };
    }
    return this.reportService.requestExport(dto.company_id, req.user.id, dto);
  }
}
