import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { MoveUsersDto } from './dto/move-users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('hr/departments')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('super_admin', 'hr_admin')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.departmentService.findAll(user.company_id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentService.findOne(id, user.company_id);
  }

  @Post()
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() user: any,
  ) {
    return this.departmentService.create(user.company_id, createDepartmentDto, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @CurrentUser() user: any,
  ) {
    return this.departmentService.update(id, user.company_id, updateDepartmentDto, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.departmentService.delete(id, user.company_id, user.id);
  }

  @Post(':id/move-users')
  async moveUsers(
    @Param('id') id: string,
    @Body() dto: MoveUsersDto,
    @CurrentUser() user: any,
  ) {
    return this.departmentService.moveUsers(
      id,
      dto.target_department_id,
      user.company_id,
      user.id,
    );
  }
}
