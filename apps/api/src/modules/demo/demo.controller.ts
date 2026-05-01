import { Controller, Post, Get, Patch, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DemoService } from './demo.service';
import { CreateDemoRequestDto } from './dto/create-demo-request.dto';
import { DemoFilterDto } from './dto/demo-filter.dto';
import { UpdateDemoStatusDto } from './dto/update-demo-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('demo-request')
  create(@Body() dto: CreateDemoRequestDto) {
    return this.demoService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Get('admin/demo-requests')
  findAll(@Query() filters: DemoFilterDto) {
    return this.demoService.findAll(filters);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Get('admin/demo-requests/pending-count')
  getPendingCount() {
    return this.demoService.getPendingCount();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Get('admin/demo-requests/:id')
  findOne(@Param('id') id: string) {
    return this.demoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Patch('admin/demo-requests/:id/status')
  updateStatus(
    @Param('id') id: string, 
    @Body() dto: UpdateDemoStatusDto,
    @CurrentUser() user: any
  ) {
    return this.demoService.updateStatus(id, dto.status, dto.notes, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @Put('admin/demo-requests/:id/notes')
  updateNotes(@Param('id') id: string, @Body('notes') notes: string) {
    return this.demoService.updateNotes(id, notes);
  }
}
