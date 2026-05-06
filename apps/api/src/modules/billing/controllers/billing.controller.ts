import { Controller, Get, Post, Body, UseGuards, Query, Req, Patch, Param, Res, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BillingService } from '../services/billing.service';
import { CreditService } from '../services/credit.service';
import { PackageService } from '../services/package.service';
import { CreditTypeService } from '../services/credit-type.service';
import { InvoiceService } from '../services/invoice.service';
import { UploadService } from '../../upload/upload.service';
import { Payment } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { Subscription } from '../entities/subscription.entity';
import { ProductPackage } from '../entities/product-package.entity';

@Controller('consultant/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly creditService: CreditService,
    private readonly packageService: PackageService,
    private readonly creditTypeService: CreditTypeService,
    private readonly invoiceService: InvoiceService,
    private readonly uploadService: UploadService,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Subscription) private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(ProductPackage) private readonly packageRepo: Repository<ProductPackage>,
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

  @Get('invoices/:paymentId/download')
  @Roles('consultant')
  async downloadInvoice(
    @Param('paymentId') paymentId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId, consultant_id: req.user.id }
    });
    if (!payment) throw new NotFoundException('Fatura bulunamadı');

    // invoice_url yoksa üret
    if (!payment.invoice_url) {
      payment.invoice_url = await this.invoiceService.generateInvoice(paymentId);
    }

    // S3 signed URL döndür (15 dakika geçerli)
    const signedUrl = await this.uploadService.getSignedGetUrl(
      payment.invoice_url, 900
    );

    return res.redirect(signedUrl);
  }

  @Get('packages')
  @Roles('consultant')
  async getPackages(@Req() req: any) {
    // Mevcut subscription'ı getir
    const subscription = await this.subscriptionRepo.findOne({
      where: { consultant_id: req.user.id, status: 'active' }
    });

    const packages = await this.packageRepo.find({
      where: { type: 'subscription', is_visible: true, is_active: true },
      order: { sort_order: 'ASC' },
    });

    return {
      current_package_key: subscription?.package_key ?? null,
      packages: packages.map(p => ({
        key:            p.key,
        label_tr:       p.label_tr,
        label_en:       p.label_en,
        description_tr: p.description_tr,
        description_en: p.description_en,
        price_monthly:  p.price_monthly,
        price_yearly:   p.price_yearly,
        currency:       p.currency,
        type:           p.type,
        credits:        p.credits,
        max_companies:  p.max_companies,
        ai_enabled:     p.ai_enabled,
        white_label:    p.white_label,
        features:       p.features ?? [],
        sort_order:     p.sort_order,
      })),
    };
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
