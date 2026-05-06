import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider } from './payment-provider.interface';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private stripe: any;

  constructor(
    private configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
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
    return { type: 'payment_intent.succeeded', data: payload };
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  // Customer oluştur
  async createCustomer(email: string): Promise<any> {
    return this.stripe.customers.create({ email });
  }

  // PaymentMethod'u customer'a bağla
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string,
  ): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  }

  // PaymentMethod detayı
  async getPaymentMethod(id: string): Promise<any> {
    return this.stripe.paymentMethods.retrieve(id);
  }

  // Kayıtlı karttan ücret çek (abonelik yenileme için)
  async chargeCustomer(params: {
    customerId:      string;
    paymentMethodId: string;
    amount:          number;  // kuruş: 199.00 TL → 19900
    currency:        string;  // 'try'
    description:     string;
    metadata:        Record<string, string>;
  }): Promise<{ success: boolean; paymentIntentId?: string; error?: string }> {
    try {
      this.logger.info('[Stripe] chargeCustomer başladı', { service: 'StripeProvider' }, {
        customerId: params.customerId,
        amount:     params.amount,
      });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount:               params.amount,
        currency:             params.currency.toLowerCase(),
        customer:             params.customerId,
        payment_method:       params.paymentMethodId,
        confirm:              true,
        off_session:          true,  // kullanıcı ekranda değil
        description:          params.description,
        metadata:             params.metadata,
      });

      if (paymentIntent.status === 'succeeded') {
        this.logger.info('[Stripe] ödeme başarılı', { service: 'StripeProvider' }, {
          paymentIntentId: paymentIntent.id
        });
        return { success: true, paymentIntentId: paymentIntent.id };
      }

      return { success: false, error: `Status: ${paymentIntent.status}` };

    } catch (err: any) {
      this.logger.error('[Stripe] chargeCustomer hatası', { service: 'StripeProvider' }, err);
      return { success: false, error: err.message };
    }
  }
}
