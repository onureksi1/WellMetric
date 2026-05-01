import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Patch,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('hr/employees')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles('super_admin', 'hr_admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() filters: UserFilterDto,
  ) {
    return this.userService.findAll(user.company_id, filters);
  }

  @Post('invite')
  async inviteSingle(
    @Body() dto: InviteUserDto,
    @CurrentUser() user: any,
  ) {
    return this.userService.inviteSingle(user.company_id, dto, user.id);
  }

  @Post('bulk-invite')
  async inviteBulk(
    @Body('s3_key') s3Key: string,
    @CurrentUser() user: any,
  ) {
    return this.userService.inviteBulk(user.company_id, s3Key, user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.userService.updateUser(id, user.company_id, dto, user.id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() user: any,
  ) {
    return this.userService.updateStatus(id, user.company_id, is_active, user.id);
  }

  @Post(':id/resend-invite')
  async resendInvite(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.userService.resendInvite(id, user.company_id, user.id);
  }

  @Post('upload-csv')
  async getUploadUrl(@CurrentUser() user: any) {
    return this.userService.getPresignedCsvUrl(user.company_id);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.softDelete(id, user.company_id, user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.findOne(id, user.company_id);
  }
}
