import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BillingService } from '../services/billing.service';
import { PackageService } from '../services/package.service';
import { CreditTypeService } from '../services/credit-type.service';

@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminBillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly packageService: PackageService,
    private readonly creditTypeService: CreditTypeService,
  ) {}

  @Get('stats')
  async getStats() {
    // This would ideally come from a dedicated reporting service
    // For now, let's get some basic aggregates from BillingService
    return this.billingService.getAdminStats();
  }

  @Get('transactions')
  async getTransactions(@Query('limit') limit: number = 20) {
    return this.billingService.getRecentTransactions(limit);
  }

  @Get('credit-types')
  getCreditTypes() {
    return this.creditTypeService.findAll(true);
  }

  @Get('packages')
  getAdminPackages() {
    return this.packageService.findAll(undefined, true);
  }
}
