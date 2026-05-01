import { Controller, Get, Post, Body, Put, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { IndustryService } from './industry.service';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  // ── Public Endpoints ───────────────────────────────────────────────
  @Get('industries')
  async findAllPublic(@Query('lang') lang: 'tr' | 'en' = 'tr') {
    const industries = await this.industryService.findAll(false);
    return industries.map((i) => ({
      value: i.slug,
      label: lang === 'en' ? (i.label_en || i.label_tr) : i.label_tr,
    }));
  }

  // ── Admin Endpoints ────────────────────────────────────────────────
  @Get('admin/industries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async findAllAdmin() {
    return this.industryService.findAll(true);
  }

  @Post('admin/industries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async create(@Body() dto: CreateIndustryDto, @CurrentUser() user: any) {
    return this.industryService.create(dto, user.id);
  }

  @Put('admin/industries/:slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async update(
    @Param('slug') slug: string,
    @Body() dto: UpdateIndustryDto,
    @CurrentUser() user: any,
  ) {
    return this.industryService.update(slug, dto, user.id);
  }

  @Patch('admin/industries/:slug/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  async updateStatus(
    @Param('slug') slug: string,
    @Body('is_active') isActive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.industryService.updateStatus(slug, isActive, user.id);
  }
}
