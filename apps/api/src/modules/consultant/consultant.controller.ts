import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Query, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConsultantService } from './consultant.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('consultant')
@Roles('consultant', 'super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultantController {
  constructor(
    private readonly consultantService: ConsultantService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('dashboard/overview')
  getDashboard(@CurrentUser() user: any) {
    return this.consultantService.getDashboard(user.id);
  }

  @Get('companies/overview')
  async getCompaniesOverview(
    @CurrentUser() user: any,
  ) {
    const consultantId = user.id;
    const companies = await this.dataSource.query(`
      SELECT
        c.id,
        c.name,
        c.industry,
        c.employee_count,
        ws.score as overall_score,
        ws_prev.score as prev_score,
        (ws.score - COALESCE(ws_prev.score, ws.score)) as delta,
        CASE
          WHEN ws.score >= 70 THEN 'good'
          WHEN ws.score >= 50 THEN 'medium'
          ELSE 'risk'
        END as status
      FROM companies c
      LEFT JOIN wellbeing_scores ws
        ON ws.company_id = c.id
        AND ws.dimension = 'overall'
        AND ws.period = TO_CHAR(DATE_TRUNC('month', NOW()), 'YYYY-MM')
      LEFT JOIN wellbeing_scores ws_prev
        ON ws_prev.company_id = c.id
        AND ws_prev.dimension = 'overall'
        AND ws_prev.period = TO_CHAR(DATE_TRUNC('month', NOW() - INTERVAL '1 month'), 'YYYY-MM')
      WHERE c.consultant_id = $1
      ORDER BY ws.score ASC NULLS LAST
    `, [consultantId]);

    return {
      companies,
      summary: {
        total:    companies.length,
        at_risk:  companies.filter((c: any) => c.status === 'risk').length,
        good:     companies.filter((c: any) => c.status === 'good').length,
        no_data:  companies.filter((c: any) => !c.overall_score).length,
      },
    };
  }

  @Get('companies')
  getCompanies(@CurrentUser() user: any, @Query() filters: any) {
    return this.consultantService.getCompanies(user.id, filters);
  }

  @Post('companies')
  createCompany(@CurrentUser() user: any, @Body() dto: any) {
    return this.consultantService.createCompany(user.id, dto);
  }

  @Get('companies/:id')
  getCompany(@CurrentUser() user: any, @Param('id') id: string) {
    return this.consultantService.verifyOwnership(user.id, id);
  }

  @Get('companies/:id/stats')
  getCompanyStats(@CurrentUser() user: any, @Param('id') id: string) {
    return this.consultantService.getCompanyStats(user.id, id);
  }


  @Post('ai/comparative-insight')
  getComparativeInsight(@CurrentUser() user: any, @Body() dto: any) {
    return this.consultantService.getComparativeInsight(user.id, dto);
  }

  @Get('companies/:id/departments')
  getDepartments(@CurrentUser() user: any, @Param('id') id: string) {
    return this.consultantService.getDepartments(user.id, id);
  }
}
