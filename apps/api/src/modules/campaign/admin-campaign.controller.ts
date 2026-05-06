import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CampaignService } from './campaign.service';
import { CampaignFilterDto, AdminStatsFilterDto } from './dto/campaign.dto';

@Controller('admin/campaigns')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll(@Query() filters: CampaignFilterDto) {
    return this.campaignService.findAll(null, filters);
  }

  @Get('stats')
  async getStats(@Query() filters: AdminStatsFilterDto) {
    return this.campaignService.getPlatformStats(filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id, null);
  }
}
