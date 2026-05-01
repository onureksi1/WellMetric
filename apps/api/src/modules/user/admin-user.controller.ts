import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PlatformUserFilterDto } from './dto/platform-user-filter.dto';
import { CreatePlatformUserDto } from './dto/create-platform-user.dto';
import { UpdatePlatformUserDto } from './dto/update-platform-user.dto';
import { AssignCompanyDto } from './dto/assign-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/users')
@Roles('super_admin', 'consultant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() filters: PlatformUserFilterDto, @CurrentUser() user: any) {
    return this.userService.findAllPlatform(filters, user);
  }

  @Get('stats')
  async getStats() {
    return this.userService.getPlatformStats();
  }

  @Post()
  async create(
    @Body() dto: CreatePlatformUserDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.createPlatformUser(dto, admin.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOnePlatform(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformUserDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.updatePlatformUser(id, dto, admin.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() admin: any,
  ) {
    return this.userService.updatePlatformStatus(id, is_active, admin.id);
  }

  @Patch(':id/assign-company')
  async assignCompany(
    @Param('id') id: string,
    @Body() dto: AssignCompanyDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.assignCompany(id, dto, admin.id);
  }

  @Post(':id/resend-invite')
  async resendInvite(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.userService.resendPlatformInvite(id, admin.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.userService.deletePlatformUser(id, admin.id);
  }
}
