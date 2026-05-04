import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentFilterDto } from './dto/content-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Content')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // Super Admin Routes
  @Get('admin/content-items')
  @Roles('super_admin')
  @ApiOperation({ summary: 'List all content items (Super Admin)' })
  findAllAdmin(@Query() filters: ContentFilterDto) {
    return this.contentService.findAll(filters, true);
  }

  @Post('admin/content-items')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Create content item' })
  create(@Body() dto: CreateContentDto, @Req() req: any) {
    return this.contentService.create(dto, req.user.id);
  }

  @Get('admin/content-items/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get content item detail' })
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Put('admin/content-items/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Update content item' })
  update(@Param('id') id: string, @Body() dto: UpdateContentDto, @Req() req: any) {
    return this.contentService.update(id, dto, req.user.id);
  }

  @Delete('admin/content-items/:id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Delete content item' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.contentService.delete(id, req.user.id);
  }

  // Consultant Routes
  @Get('consultant/content-items')
  @Roles('consultant')
  @ApiOperation({ summary: 'List consultant content items' })
  findAllConsultant(@Query() filters: ContentFilterDto, @Req() req: any) {
    return this.contentService.findAll(filters, true, req.user.id);
  }

  @Post('consultant/content-items')
  @Roles('consultant')
  @ApiOperation({ summary: 'Create consultant content item' })
  createConsultant(@Body() dto: CreateContentDto, @Req() req: any) {
    return this.contentService.create(dto, req.user.id, req.user.id);
  }

  @Put('consultant/content-items/:id')
  @Roles('consultant')
  @ApiOperation({ summary: 'Update consultant content item' })
  async updateConsultant(@Param('id') id: string, @Body() dto: UpdateContentDto, @Req() req: any) {
    // Ownership check
    const content = await this.contentService.findOne(id);
    if (content.consultant_id !== req.user.id) {
      throw new BadRequestException('Bu içerik size ait değil.');
    }
    return this.contentService.update(id, dto, req.user.id);
  }

  @Delete('consultant/content-items/:id')
  @Roles('consultant')
  @ApiOperation({ summary: 'Delete consultant content item' })
  async deleteConsultant(@Param('id') id: string, @Req() req: any) {
    // Ownership check
    const content = await this.contentService.findOne(id);
    if (content.consultant_id !== req.user.id) {
      throw new BadRequestException('Bu içerik size ait değil.');
    }
    return this.contentService.delete(id, req.user.id);
  }

  // HR Admin & Employee & Super Admin Routes
  @Get('content')
  @Roles('super_admin', 'hr_admin', 'employee')
  @ApiOperation({ summary: 'List active content items' })
  findAll(@Query() filters: ContentFilterDto) {
    return this.contentService.findAll(filters, false);
  }

  // Employee Only Routes (Personal Recommendations)
  @Get('employee/content')
  @Roles('employee')
  @ApiOperation({ summary: 'Get personal content recommendations' })
  getPersonalRecommendations(@Req() req: any) {
    const language = req.user.language || 'tr';
    return this.contentService.getPersonalRecommendations(req.user.id, language);
  }
}
