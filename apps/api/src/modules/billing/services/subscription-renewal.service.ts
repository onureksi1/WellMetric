import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { ProductPackage } from '../entities/product-package.entity';
import { CreditBalance } from '../entities/credit-balance.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { ConsultantPlan } from '../../consultant/entities/consultant-plan.entity';
import { User } from '../../user/entities/user.entity';
import { PaymentMethodService } from './payment-method.service';
import { InvoiceService } from './invoice.service';
import { StripeProvider } from '../providers/stripe.provider';
import { NotificationService } from '../../notification/notification.service';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class SubscriptionRenewalService {
  constructor(
    @InjectRepository(Subscription)   private subRepo:      Repository<Subscription>,
    @InjectRepository(Payment)        private paymentRepo:  Repository<Payment>,
    @InjectRepository(ProductPackage) private packageRepo:  Repository<ProductPackage>,
    @InjectRepository(CreditBalance)  private balanceRepo:  Repository<CreditBalance>,
    @InjectRepository(CreditTransaction) private txRepo:   Repository<CreditTransaction>,
    @InjectRepository(ConsultantPlan) private planRepo:     Repository<ConsultantPlan>,
    @InjectRepository(User)           private userRepo:     Repository<User>,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly stripeProvider:       StripeProvider,
    private readonly notificationService:  NotificationService,
    private readonly invoiceService:       InvoiceService,
    private readonly logger:               AppLogger,
    private readonly dataSource:           DataSource,
  ) {}

  // Ana yenileme metodu — CRON tarafından çağrılır
  async processRenewals(): Promise<{
    renewed: number;
    failed: number;
    past_due: number;
    expired: number;
  }> {
    const now    = new Date();
    const stats  = { renewed: 0, failed: 0, past_due: 0, expired: 0 };

    // 1. Süresi dolmuş aktif abonelikleri bul
    const dueSubscriptions = await this.subRepo.find({
      where: {
        status: 'active',
        current_period_end: LessThanOrEqual(now),
        cancel_at_period_end: false,
      },
      relations: ['consultant'],
    });

    this.logger.info('Yenilenecek abonelikler bulundu', {
      service: 'SubscriptionRenewalService'
    }, { count: dueSubscriptions.length });

    for (const sub of dueSubscriptions) {
      try {
        const result = await this.renewSubscription(sub);
        if (result.success) {
          stats.renewed++;
        } else {
          stats.failed++;
          await this.handleFailedRenewal(sub, result.error || 'Bilinmeyen hata');
          stats.past_due++;
        }
      } catch (err) {
        stats.failed++;
        this.logger.error('Abonelik yenileme exception', {
          service: 'SubscriptionRenewalService',
          userId: sub.consultant_id,
        }, err);
      }
    }

    // 2. past_due → 3 günden fazlaysa expired yap
    const expiredCount = await this.expirePastDue(now);
    stats.expired = expiredCount;

    return stats;
  }

  // Tek aboneliği yenile
  private async renewSubscription(sub: Subscription): Promise<{
    success: boolean;
    error?: string;
  }> {
    const ctx = { service: 'SubscriptionRenewalService', userId: sub.consultant_id };

    this.logger.info('Abonelik yenileme başladı', ctx, {
      subscriptionId: sub.id,
      provider:       this.getProvider(sub),
    });

    const pkg = await this.packageRepo.findOne({ where: { key: sub.package_key } });
    if (!pkg) {
      this.logger.error('Paket bulunamadı', ctx, { package_key: sub.package_key });
      return { success: false, error: 'Paket bulunamadı' };
    }

    const amount = sub.interval === 'yearly'
      ? (pkg.price_yearly || Number(pkg.price_monthly) * 10) // fallback if yearly not set
      : pkg.price_monthly;

    // Provider'a göre ücret çek
    let chargeResult: { success: boolean; paymentIntentId?: string; error?: string };

    const provider = this.getProvider(sub);

    if (provider === 'stripe' && sub.stripe_customer_id) {
      const method = await this.paymentMethodService.getDefaultMethod(
        sub.consultant_id, 'stripe'
      );
      if (!method?.stripe_payment_method_id) {
        return { success: false, error: 'Kayıtlı Stripe kartı bulunamadı' };
      }
      chargeResult = await this.stripeProvider.chargeCustomer({
        customerId:      sub.stripe_customer_id,
        paymentMethodId: method.stripe_payment_method_id,
        amount:          Math.round(Number(amount) * 100),
        currency:        'try',
        description:     `${pkg.label_tr} — ${sub.interval === 'yearly' ? 'Yıllık' : 'Aylık'} Yenileme`,
        metadata: {
          subscription_id: sub.id,
          consultant_id:   sub.consultant_id,
          package_key:     sub.package_key,
        },
      });

    } else {
      // PayTR veya kayıtlı kart yok → fatura maili gönder
      this.logger.warn('Otomatik tahsilat yapılamıyor — manuel ödeme bekleniyor', ctx);
      await this.notificationService.sendEmail(
        sub.consultant.email,
        'subscription_renewal_manual',
        {
          full_name:    sub.consultant.full_name,
          package_name: pkg.label_tr,
          amount:       `${amount} ${pkg.currency}`,
          payment_url:  `${process.env.APP_URL}/consultant/billing?tab=subscription`,
        }
      );
      return { success: false, error: 'Manuel ödeme gerekiyor' };
    }

    if (!chargeResult.success) {
      this.logger.warn('Ödeme başarısız', ctx, { error: chargeResult.error });
      return { success: false, error: chargeResult.error };
    }

    // Ödeme başarılı — aboneliği yenile
    await this.completeRenewal(sub, pkg, chargeResult.paymentIntentId || 'renewal-' + Date.now(), Number(amount));
    return { success: true };
  }

  // Başarılı yenileme — DB güncelle + kredi yükle
  private async completeRenewal(
    sub: Subscription,
    pkg: ProductPackage,
    paymentId: string,
    amount: number,
  ): Promise<void> {
    const ctx = { service: 'SubscriptionRenewalService', userId: sub.consultant_id };

    // Yeni dönem hesapla
    const periodStart = new Date();
    const periodEnd   = new Date(periodStart);
    if (sub.interval === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    await this.dataSource.transaction(async (manager) => {
      // 1. Abonelik güncelle
      await manager.update(Subscription, sub.id, {
        status:               'active',
        current_period_start: periodStart,
        current_period_end:   periodEnd,
        retry_count:          0,
        past_due_since:       null,
      });

      // 2. Ödeme kaydı
      await manager.save(Payment, {
        consultant_id:       sub.consultant_id,
        amount,
        currency:            pkg.currency,
        provider:            this.getProvider(sub),
        provider_payment_id: paymentId,
        status:              'completed',
        type:                'subscription',
        package_key:         sub.package_key,
      });

      // 3. Kredileri yenile
      const credits = pkg.credits as Record<string, number>;
      for (const [creditTypeKey, creditAmount] of Object.entries(credits)) {
        if (creditAmount === 0) continue;

        const newBalance = creditAmount === -1 ? -1 : creditAmount;

        await manager.upsert(CreditBalance, {
          consultant_id:   sub.consultant_id,
          credit_type_key: creditTypeKey,
          balance:         newBalance,
          used_this_month: 0,
          last_reset_at:   periodStart,
        }, ['consultant_id', 'credit_type_key']);

        await manager.save(CreditTransaction, {
          consultant_id:   sub.consultant_id,
          credit_type_key: creditTypeKey,
          type:            'reset',
          amount:          creditAmount === -1 ? 0 : creditAmount,
          description:     `${pkg.label_tr} yenileme`,
          reference_id:    sub.id,
        });
      }
    });

    // Ödeme başarılı → fatura üret → mail gönder
    try {
      const payment = await this.paymentRepo.findOne({
        where: { provider_payment_id: paymentId }
      });

      if (payment) {
        await this.invoiceService.generateInvoice(payment.id);

        await this.notificationService.sendEmail(
          sub.consultant.email,
          'invoice_ready',
          {
            full_name:      sub.consultant.full_name,
            invoice_number: `INV-${new Date().getFullYear()}-${payment.id.slice(-6).toUpperCase()}`,
            amount:         `${amount} ${pkg.currency}`,
            invoice_url:    `${process.env.APP_URL}/api/v1/consultant/billing/invoices/${payment.id}/download`,
            date:           new Date().toLocaleDateString('tr-TR'),
          }
        );
      }
    } catch (err) {
      this.logger.error('Fatura üretimi/mail gönderimi başarısız', ctx, err);
    }

    this.logger.info('Abonelik yenileme tamamlandı', ctx, {
      subscriptionId: sub.id, periodEnd
    });
  }

  // Başarısız yenileme — past_due
  private async handleFailedRenewal(sub: Subscription, error: string): Promise<void> {
    const ctx = { service: 'SubscriptionRenewalService', userId: sub.consultant_id };

    const retryCount = (sub.retry_count ?? 0) + 1;
    const now        = new Date();

    await this.subRepo.update(sub.id, {
      status:        'past_due',
      retry_count:   retryCount,
      last_retry_at: now,
      past_due_since: sub.past_due_since ?? now,
    });

    this.logger.warn('Abonelik past_due yapıldı', ctx, {
      retryCount, error
    });

    // Uyarı maili gönder
    const pkg = await this.packageRepo.findOne({ where: { key: sub.package_key } });
    await this.notificationService.sendEmail(
      sub.consultant.email,
      'subscription_payment_failed',
      {
        full_name:    sub.consultant.full_name,
        package_name: pkg?.label_tr ?? sub.package_key,
        error,
        payment_url:  `${process.env.APP_URL}/consultant/billing?tab=subscription`,
        days_left:    3,
      }
    );
  }

  // past_due → 3 günden fazlaysa expired
  private async expirePastDue(now: Date): Promise<number> {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 3);

    const pastDueSubs = await this.subRepo.find({
      where: {
        status:         'past_due',
        past_due_since: LessThanOrEqual(cutoff),
      },
      relations: ['consultant'],
    });

    for (const sub of pastDueSubs) {
      await this.subRepo.update(sub.id, { status: 'expired' });

      // Consultant planını kısıtla
      await this.planRepo.update(
        { consultant_id: sub.consultant_id },
        { is_active: false }
      );

      // Expired maili
      await this.notificationService.sendEmail(
        sub.consultant.email,
        'subscription_expired',
        {
          full_name:   sub.consultant.full_name,
          renew_url:   `${process.env.APP_URL}/consultant/billing?tab=subscription`,
        }
      );

      this.logger.warn('Abonelik expired yapıldı', {
        service: 'SubscriptionRenewalService',
        userId:  sub.consultant_id,
      }, { subscriptionId: sub.id });
    }

    return pastDueSubs.length;
  }

  private getProvider(sub: Subscription): string {
    if (sub.stripe_customer_id) return 'stripe';
    return sub.provider || 'paytr';
  }
}
