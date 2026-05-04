import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private stripe: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_unused';
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createPaymentIntent(amount: number, currency: string, metadata: any) {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency,
      metadata,
    });
    return {
      client_secret: intent.client_secret,
      id: intent.id,
    };
  }

  async verifyWebhook(payload: any, signature: string) {
    // In a real scenario, this would use stripe.webhooks.constructEvent
    // with a secret from platform_settings
    return { type: 'payment_intent.succeeded', data: payload };
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }
}
