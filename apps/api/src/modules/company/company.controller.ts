import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CompanyFilterDto } from './dto/company-filter.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('admin/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'consultant')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  findAll(@Query() filters: CompanyFilterDto, @CurrentUser() user: any) {
    return this.companyService.findAll(filters, user);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: any) {
    return this.companyService.create(dto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateStatus(id, is_active, user.id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateSettings(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companyService.delete(id, user.id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.companyService.getStats(id);
  }

  @Post(':id/upload-logo')
  getPresignedLogoUrl(
    @Param('id') id: string,
    @Body('file_type') fileType: string,
    @Body('mime_type') mimeType: string,
  ) {
    return this.companyService.getPresignedLogoUrl(id, fileType, mimeType);
  }

  // ── Company User Management ──────────────────────────────────────────

  @Get(':id/users')
  getUsers(@Param('id') id: string, @Query() filters: any) {
    return this.companyService.getCompanyUsers(id, filters);
  }

  @Post(':id/users')
  addUser(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.addCompanyUser(id, dto, admin.id);
  }

  @Patch(':id/users/:userId')
  updateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: any,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.updateCompanyUser(id, userId, dto, admin.id);
  }

  @Patch(':id/users/:userId/status')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.toggleCompanyUserStatus(id, userId, is_active, admin.id);
  }

  @Delete(':id/users/:userId')
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.deleteCompanyUser(id, userId, admin.id);
  }

  @Post(':id/users/bulk-delete')
  bulkDeleteUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('user_ids') userIds: string[],
    @CurrentUser() admin: any,
  ) {
    return this.companyService.bulkDeleteCompanyUsers(id, userIds, admin.id);
  }

  @Post(':id/users/:userId/resend-invite')
  resendInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.resendCompanyUserInvite(id, userId, admin.id);
  }

  @Post(':id/users/import')
  importUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('users') users: any[],
    @CurrentUser() admin: any,
  ) {
    return this.companyService.importCompanyUsers(id, users, admin.id);
  }

  // ── Company Department Management ────────────────────────────────────

  @Get(':id/departments')
  getDepartments(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getCompanyDepartments(id);
  }

  @Post(':id/departments')
  addDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.addCompanyDepartment(id, dto, admin.id);
  }

  @Put(':id/departments/:deptId')
  updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deptId', ParseUUIDPipe) deptId: string,
    @Body() dto: any,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.updateCompanyDepartment(id, deptId, dto, admin.id);
  }

  @Delete(':id/departments/:deptId')
  deleteDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deptId', ParseUUIDPipe) deptId: string,
    @CurrentUser() admin: any,
  ) {
    return this.companyService.deleteCompanyDepartment(id, deptId, admin.id);
  }

  // ── Other Tabs Data ──────────────────────────────────────────────────

  @Get(':id/surveys')
  getSurveys(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.getCompanySurveys(id);
  }
}
