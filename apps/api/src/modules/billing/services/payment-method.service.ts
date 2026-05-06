import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantPaymentMethod } from '../entities/consultant-payment-method.entity';
import { StripeProvider } from '../providers/stripe.provider';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(ConsultantPaymentMethod)
    private readonly methodRepo: Repository<ConsultantPaymentMethod>,
    private readonly stripeProvider:  StripeProvider,
    private readonly logger: AppLogger,
  ) {}

  // Stripe — kart kaydet
  async saveStripeCard(
    consultantId: string,
    paymentMethodId: string,
    email: string,
  ): Promise<void> {
    this.logger.info('Stripe kart kaydediliyor', { service: 'PaymentMethodService' }, {
      consultantId, paymentMethodId
    });

    // Stripe customer oluştur veya getir
    let customerId = await this.getStripeCustomerId(consultantId);
    if (!customerId) {
      const customer = await this.stripeProvider.createCustomer(email);
      customerId = customer.id;
    }

    // Kartı customer'a bağla
    await this.stripeProvider.attachPaymentMethod(paymentMethodId, customerId);
    const pm = await this.stripeProvider.getPaymentMethod(paymentMethodId);

    await this.methodRepo.upsert({
      consultant_id:            consultantId,
      provider:                 'stripe',
      is_default:               true,
      stripe_customer_id:       customerId,
      stripe_payment_method_id: paymentMethodId,
      stripe_last4:             pm.card?.last4,
      stripe_brand:             pm.card?.brand,
      expires_month:            String(pm.card?.exp_month),
      expires_year:             String(pm.card?.exp_year),
    }, ['consultant_id', 'provider']);

    this.logger.info('Stripe kart kaydedildi', { service: 'PaymentMethodService' }, {
      consultantId, last4: pm.card?.last4
    });
  }

  async getDefaultMethod(consultantId: string, provider: string) {
    return this.methodRepo.findOne({
      where: { consultant_id: consultantId, provider, is_default: true }
    });
  }

  private async getStripeCustomerId(consultantId: string): Promise<string | null> {
    const method = await this.methodRepo.findOne({
      where: { consultant_id: consultantId, provider: 'stripe' }
    });
    return method?.stripe_customer_id ?? null;
  }
}
