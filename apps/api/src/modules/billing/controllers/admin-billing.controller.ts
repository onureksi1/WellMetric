import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BillingService } from '../services/billing.service';
import { PackageService } from '../services/package.service';
import { CreditTypeService } from '../services/credit-type.service';
import { CreateCreditTypeDto } from '../dto/create-credit-type.dto';
import { UpdateCreditTypeDto } from '../dto/update-credit-type.dto';
import { CreatePackageDto } from '../dto/create-package.dto';
import { UpdatePackageDto } from '../dto/update-package.dto';

@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminBillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly packageService: PackageService,
    private readonly creditTypeService: CreditTypeService,
  ) {}

  // ── Stats & Transactions ─────────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    return this.billingService.getAdminStats();
  }

  @Get('transactions')
  async getTransactions(@Query('limit') limit: number = 20) {
    return this.billingService.getRecentTransactions(limit);
  }

  // ── Credit Types ─────────────────────────────────────────────────────────

  @Get('credit-types')
  getCreditTypes() {
    return this.creditTypeService.findAll(true);
  }

  @Post('credit-types')
  async createCreditType(@Body() dto: CreateCreditTypeDto) {
    console.log('[AdminBillingController.createCreditType]', dto);
    return this.creditTypeService.create(dto);
  }

  @Put('credit-types/:key')
  async updateCreditType(
    @Param('key') key: string,
    @Body() dto: UpdateCreditTypeDto,
  ) {
    console.log('[AdminBillingController.updateCreditType]', { key, dto });
    // key değiştirilemez — dto'daki key alanını kaldır
    const { key: _k, ...safeDto } = dto as any;
    return this.creditTypeService.update(key, safeDto);
  }

  @Patch('credit-types/:key/status')
  async toggleCreditTypeStatus(
    @Param('key') key: string,
    @Body('is_active') isActive: boolean,
  ) {
    console.log('[AdminBillingController.toggleCreditTypeStatus]', { key, isActive });
    return this.creditTypeService.updateStatus(key, isActive);
  }

  @Delete('credit-types/:key')
  async deleteCreditType(@Param('key') key: string) {
    return this.creditTypeService.delete(key);
  }

  // ── Packages ─────────────────────────────────────────────────────────────

  @Get('packages')
  getAdminPackages() {
    return this.packageService.findAll(undefined, true);
  }

  @Post('packages')
  async createPackage(@Body() dto: CreatePackageDto) {
    console.log('[AdminBillingController.createPackage]', dto);
    return this.packageService.create(dto);
  }

  @Put('packages/:key')
  async updatePackage(
    @Param('key') key: string,
    @Body() dto: UpdatePackageDto,
  ) {
    console.log('[AdminBillingController.updatePackage]', { key, dto });
    const { key: _k, ...safeDto } = dto as any;
    return this.packageService.update(key, safeDto);
  }

  @Patch('packages/:key/status')
  async togglePackageStatus(
    @Param('key') key: string,
    @Body('is_active') isActive: boolean,
  ) {
    console.log('[AdminBillingController.togglePackageStatus]', { key, isActive });
    return this.packageService.updateStatus(key, isActive);
  }

  @Patch('packages/:key/visibility')
  async togglePackageVisibility(
    @Param('key') key: string,
    @Body('is_visible') isVisible: boolean,
  ) {
    console.log('[AdminBillingController.togglePackageVisibility]', { key, isVisible });
    return this.packageService.toggleVisibility(key, isVisible);
  }

  @Delete('packages/:key')
  async deletePackage(@Param('key') key: string) {
    return this.packageService.delete(key);
  }
}
