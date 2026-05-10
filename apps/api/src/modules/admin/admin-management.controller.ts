import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminManagementService } from './admin-management.service';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin-management.dto';

@Controller('admin/management')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminManagementController {
  constructor(private readonly adminManagementService: AdminManagementService) {}

  @Get()
  findAll() {
    return this.adminManagementService.findAll();
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.adminManagementService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminManagementService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.adminManagementService.delete(id);
  }
}
