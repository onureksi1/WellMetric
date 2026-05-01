import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin / Audit Logs')
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all audit logs (Super Admin)' })
  findAll(@Query() filters: AuditFilterDto) {
    return this.auditService.findAll(filters);
  }

  @Get('company/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get audit logs for a specific company' })
  findByCompany(@Param('id') id: string, @Query() filters: AuditFilterDto) {
    return this.auditService.findByCompany(id, filters);
  }

  @Get('critical')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get recent critical audit logs' })
  getRecentCritical() {
    return this.auditService.getRecentCritical();
  }
}
