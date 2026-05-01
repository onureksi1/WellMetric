import { Controller, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { BillingService } from '../services/billing.service';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe')
  async handleStripeWebhook(@Body() payload: any, @Headers('stripe-signature') signature: string) {
    // In a real scenario: verify signature then process
    console.log('Stripe Webhook received:', payload.type);
    
    if (payload.type === 'payment_intent.succeeded') {
      const { consultant_id, package_key, interval } = payload.data.object.metadata;
      await this.billingService.handlePaymentSuccess(
        consultant_id,
        package_key,
        'stripe',
        payload.data.object.id,
        payload.data.object.amount / 100
      );
    }
    
    return { received: true };
  }

  @Post('iyzico')
  async handleIyzicoWebhook(@Body() payload: any) {
    // Similar logic for Iyzico
    return { status: 'success' };
  }
}
