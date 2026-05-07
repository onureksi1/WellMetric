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
import { ConsultantService } from './consultant.service';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('consultant')
@Roles('consultant', 'super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('dashboard/overview')
  getDashboard(@CurrentUser() user: any) {
    return this.consultantService.getDashboard(user.id);
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
