import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { EmployeeDashboardService } from './employee-dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { SegmentQueryDto } from './dto/segment-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly adminDashboardService: AdminDashboardService,
    private readonly employeeDashboardService: EmployeeDashboardService,
  ) {}

  // ── HR Admin Routes ──────────────────────────────────────────────
  @Get('hr/dashboard/overview')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrOverview(@CurrentUser() user: any, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getOverview(user.company_id, query.period);
  }

  @Get('hr/dashboard/dimensions')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrDimensions(@CurrentUser() user: any, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getDimensions(user.company_id, query.period);
  }

  @Get('hr/dashboard/departments')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrDepartments(@CurrentUser() user: any, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getDepartments(user.company_id, query.period);
  }

  @Get('hr/dashboard/segments')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrSegments(@CurrentUser() user: any, @Query() query: SegmentQueryDto) {
    return this.dashboardService.getSegments(user.company_id, query.period!, query.type);
  }

  @Get('hr/dashboard/trend')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrTrend(@CurrentUser() user: any, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getTrends(user.company_id, query.months, query.department_id);
  }

  @Get('hr/dashboard/benchmark')
  @Roles('super_admin', 'hr_admin')
  @UseGuards(TenantGuard)
  async getHrBenchmark(@CurrentUser() user: any, @Query() query: DashboardQueryDto) {
    return this.dashboardService.getBenchmark(user.company_id, query.period);
  }

  // ── Super Admin Routes ───────────────────────────────────────────
  @Get('admin/dashboard/overview')
  @Roles('super_admin')
  async getAdminOverview() {
    return this.adminDashboardService.getAdminOverview();
  }

  @Get('admin/dashboard/company/:id')
  @Roles('super_admin')
  async getAdminCompanyStats(@Param('id') id: string, @Query('period') period?: string) {
    return this.adminDashboardService.getAdminCompanyStats(id, period);
  }

  // ── Employee Routes ──────────────────────────────────────────────
  @Get('employee/me')
  @Roles('employee', 'hr_admin', 'super_admin')
  async getEmployeeMe(@CurrentUser() user: any) {
    return this.employeeDashboardService.getMe(user.id);
  }

  @Put('employee/me')
  @Roles('employee', 'hr_admin', 'super_admin')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.employeeDashboardService.updateProfile(user.id, dto);
  }
}
