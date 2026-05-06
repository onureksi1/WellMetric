import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, CampaignFilterDto, LogFilterDto, AdminStatsFilterDto } from './dto/campaign.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  // --- HR ADMIN ROUTES ---

  @Roles('super_admin', 'hr_admin')
  @Get('hr/campaigns')
  async findAllHr(@CurrentUser() user: any, @Query() filters: CampaignFilterDto) {
    return this.campaignService.findAll(user.company_id, filters);
  }

  @Roles('super_admin', 'hr_admin')
  @Post('hr/campaigns')
  async create(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.campaignService.create(user.company_id, user.id, dto);
  }

  @Roles('super_admin', 'hr_admin')
  @Get('hr/campaigns/:id')
  async findOneHr(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignService.findOne(id, user.company_id);
  }

  @Roles('super_admin', 'hr_admin')
  @Get('hr/campaigns/:id/logs')
  async findLogsHr(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query() filters: LogFilterDto,
  ) {
    return this.campaignService.findLogs(id, user.company_id, filters);
  }

  @Roles('super_admin', 'hr_admin')
  @Post('hr/campaigns/:id/remind')
  async remind(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignService.remind(id, user.company_id, user.id);
  }

  @Roles('super_admin', 'hr_admin')
  @Patch('hr/campaigns/:id/cancel')
  async cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignService.cancel(id, user.company_id, user.id);
  }
}
