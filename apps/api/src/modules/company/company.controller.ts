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
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companyService.findOne(id, user);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateStatus(id, is_active, user);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateSettings(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companyService.delete(id, user);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.companyService.getStats(id, user);
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
  getUsers(@Param('id') id: string, @Query() filters: any, @CurrentUser() user: any) {
    return this.companyService.getCompanyUsers(id, filters, user);
  }

  @Post(':id/users')
  addUser(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.companyService.addCompanyUser(id, dto, user);
  }

  @Patch(':id/users/:userId')
  updateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateCompanyUser(id, userId, dto, user);
  }

  @Patch(':id/users/:userId/status')
  updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('is_active') is_active: boolean,
    @CurrentUser() user: any,
  ) {
    return this.companyService.toggleCompanyUserStatus(id, userId, is_active, user);
  }

  @Delete(':id/users/:userId')
  deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: any,
  ) {
    return this.companyService.deleteCompanyUser(id, userId, user);
  }

  @Post(':id/users/bulk-delete')
  bulkDeleteUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('user_ids') userIds: string[],
    @CurrentUser() user: any,
  ) {
    return this.companyService.bulkDeleteCompanyUsers(id, userIds, user);
  }

  @Post(':id/users/:userId/resend-invite')
  resendInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: any,
  ) {
    return this.companyService.resendCompanyUserInvite(id, userId, user);
  }

  @Post(':id/users/import')
  importUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('users') users: any[],
    @CurrentUser() user: any,
  ) {
    return this.companyService.importCompanyUsers(id, users, user);
  }

  // ── Company Department Management ────────────────────────────────────

  @Get(':id/departments')
  getDepartments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.companyService.getCompanyDepartments(id, user);
  }

  @Post(':id/departments')
  addDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.companyService.addCompanyDepartment(id, dto, user);
  }

  @Put(':id/departments/:deptId')
  updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deptId', ParseUUIDPipe) deptId: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.companyService.updateCompanyDepartment(id, deptId, dto, user);
  }

  @Delete(':id/departments/:deptId')
  deleteDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('deptId', ParseUUIDPipe) deptId: string,
    @CurrentUser() user: any,
  ) {
    return this.companyService.deleteCompanyDepartment(id, deptId, user);
  }

  // ── Other Tabs Data ──────────────────────────────────────────────────

  @Get(':id/surveys')
  getSurveys(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.companyService.getCompanySurveys(id, user);
  }
}
