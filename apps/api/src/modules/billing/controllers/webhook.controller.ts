import { Controller, Post, Headers, BadRequestException, Req, HttpCode, Body, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const Stripe = require('stripe');
import { BillingService } from '../services/billing.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaytrProvider } from '../providers/paytr.provider';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('webhooks')
export class WebhookController {
  private stripe: any;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
    private readonly paytrProvider: PaytrProvider,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    } as any);
  }

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      throw new BadRequestException('Webhook configuration missing');
    }

    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook imza hatası: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const { consultant_id, package_key } = paymentIntent.metadata;

      await this.billingService.handlePaymentSuccess(
        consultant_id,
        package_key,
        'stripe',
        paymentIntent.id,
        paymentIntent.amount / 100,
      );
    }

    return { received: true };
  }



  // ── PayTR Webhook ─────────────────────────────────────────────────
  @Post('paytr')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ global: { ttl: 60000, limit: 100 } })
  async paytrWebhook(@Body() body: any) {
    const isValid = this.paytrProvider.verifyWebhook({
      merchantOid: body.merchant_oid,
      status:      body.status,
      totalAmount: body.total_amount,
      hash:        body.hash,
    });

    if (!isValid) {
      console.error('PayTR: Geçersiz webhook imzası');
      return 'OK';
    }

    const payment = await this.paymentRepo.findOne({
      where: { provider_payment_id: body.merchant_oid, provider: 'paytr' }
    });

    if (!payment) {
      console.error('PayTR: Ödeme bulunamadı:', body.merchant_oid);
      return 'OK';
    }

    if (body.status === 'success') {
      await this.paymentRepo.update(payment.id, { status: 'completed' });
      await this.billingService.activatePackageById(
        payment.consultant_id,
        payment.package_key,
      );
    } else {
      await this.paymentRepo.update(payment.id, { status: 'failed' });
    }

    return 'OK';
  }
}
