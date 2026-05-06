import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConsultantReportsService } from './consultant-reports.service';

@Controller('hr/consultant-reports')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class HrConsultantReportsController {
  constructor(private readonly reportsService: ConsultantReportsService) {}

  @Get()
  @Roles('hr_admin')
  findAll(@CurrentUser() user: any) {
    return this.reportsService.findPublishedForCompany(user.company_id);
  }

  @Get(':id')
  @Roles('hr_admin')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reportsService.findOnePublished(id, user.company_id);
  }
}
