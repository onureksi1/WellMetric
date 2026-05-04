import { Controller, Get, Post, Body, UseGuards, Query, Req, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BillingService } from '../services/billing.service';
import { CreditService } from '../services/credit.service';
import { PackageService } from '../services/package.service';
import { CreditTypeService } from '../services/credit-type.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';

@Controller('consultant/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly creditService: CreditService,
    private readonly packageService: PackageService,
    private readonly creditTypeService: CreditTypeService,
  ) {}

  // --- Consultant Endpoints ---
  
  @Get('subscription')
  @Roles('consultant')
  getSubscription(@Req() req: any) {
    return this.billingService.getSubscription(req.user.id);
  }

  @Get('credits')
  @Roles('consultant')
  getCredits(@Req() req: any) {
    return this.creditService.getBalances(req.user.id);
  }

  @Get('invoices')
  @Roles('consultant')
  getInvoices(@Req() req: any) {
    return this.billingService.getInvoices(req.user.id);
  }

  @Get('packages')
  @Roles('consultant')
  getPackages(@Query('type') type: string) {
    return this.packageService.findAll(type, false, true);
  }

  @Get('usage')
  @Roles('consultant')
  getUsage(@Req() req: any) {
    return this.creditService.getUsageStats(req.user.id);
  }

  @Post('subscribe')
  @Roles('consultant')
  subscribe(@Req() req: any, @Body() body: any) {
    return this.billingService.subscribe(req.user.id, body.package_key, body.interval, body.provider);
  }

  @Post('payment')
  @Roles('consultant')
  createPayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    return this.billingService.createPayment(dto, req.user.id);
  }

  @Post('cancel')
  @Roles('consultant')
  cancelSubscription(@Req() req: any) {
    return this.billingService.cancelSubscription(req.user.id);
  }

  // --- Admin Endpoints ---

  @Get('admin/credit-types')
  @Roles('super_admin')
  getCreditTypes() {
    return this.creditTypeService.findAll(true);
  }

  @Get('admin/packages')
  @Roles('super_admin')
  getAdminPackages() {
    return this.packageService.findAll(undefined, true);
  }
}
