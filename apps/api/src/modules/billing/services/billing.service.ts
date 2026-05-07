import { Injectable, Logger, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { ProductPackage } from '../entities/product-package.entity';
import { PackageService } from './package.service';
import { CreditService } from './credit.service';
import { StripeProvider } from '../providers/stripe.provider';
import { PaytrProvider } from '../providers/paytr.provider';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ConsultantPaymentMethod } from '../entities/consultant-payment-method.entity';
import { User } from '../../user/entities/user.entity';
import { InvoiceService } from './invoice.service';
import { NotificationService } from '../../notification/notification.service';
import { AppLogger } from '../../../common/logger/app-logger.service';
import { ServiceDebugger } from '../../../common/logger/debug.helper';
import { ConsultantPlan } from '../../consultant/entities/consultant-plan.entity';
import { InAppNotificationService } from '../../notification/in-app-notification.service';

@Injectable()
export class BillingService {
  private readonly debug: ServiceDebugger;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProductPackage)
    private readonly packageRepository: Repository<ProductPackage>,
    @InjectRepository(ConsultantPlan)
    private readonly planRepository: Repository<ConsultantPlan>,
    private readonly packageService: PackageService,
    private readonly creditService: CreditService,
    private readonly stripeProvider: StripeProvider,
    private readonly paytrProvider: PaytrProvider,
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
    private readonly invoiceService: InvoiceService,
    private readonly notificationService: NotificationService,
    private readonly inAppNotifService: InAppNotificationService,
  ) {
    this.debug = new ServiceDebugger(logger, 'BillingService');
  }

  private readonly PACKAGE_ORDER = ['starter', 'growth', 'enterprise'];

  async validateUpgrade(consultantId: string, newPackageKey: string) {
    const current = await this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' }
    });

    if (current) {
      const currentOrder = this.PACKAGE_ORDER.indexOf(current.package_key);
      const newOrder     = this.PACKAGE_ORDER.indexOf(newPackageKey);

      if (current.package_key === newPackageKey) {
        throw new BadRequestException('Bu paket zaten aktif');
      }

      if (newOrder < currentOrder && newOrder !== -1) {
        throw new BadRequestException(
          'Daha düşük bir pakete geçemezsiniz. ' +
          'Plan düşürme için destek ile iletişime geçin.'
        );
      }
    }
    return true;
  }

  async createPayment(params: CreatePaymentDto, consultantId: string) {
    const ctx = { userId: consultantId };
    this.debug.start('createPayment', ctx, {
      provider: params.provider,
      package:  params.package_key,
      type:     params.type,
    });

    try {
      this.debug.step('createPayment', 'consultant bilgisi alınıyor', ctx);
      const consultant = await this.userRepository.findOne({ where: { id: consultantId } });
      if (!consultant) {
        this.logger.warn('Consultant not found', ctx);
        throw new NotFoundException('Consultant not found');
      }

      let result;
      switch (params.provider) {
        case 'stripe':
          this.debug.step('createPayment', 'Stripe ödeme başlatılıyor', ctx);
          result = { success: false, message: 'Stripe integration placeholder' };
          break;

        case 'paytr':
          this.debug.step('createPayment', 'PayTR ödeme başlatılıyor', ctx);
          result = await this.handlePaytrPayment(params, consultant);
          break;

        default:
          throw new BadRequestException('Geçersiz ödeme sağlayıcısı');
      }

      this.debug.done('createPayment', ctx, result);
      return result;
    } catch (err) {
      this.debug.fail('createPayment', ctx, err);
      throw err;
    }
  }

  // ── PayTR ödeme handler ───────────────────────────────────────────
  private async handlePaytrPayment(params: CreatePaymentDto, consultant: User) {
    const pkg = await this.packageRepository.findOne({
      where: { key: params.package_key }
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Downgrade/Duplicate kontrolü
    await this.validateUpgrade(consultant.id, params.package_key);

    const merchantOid = `${consultant.id.slice(0, 8)}-${Date.now()}`;

    const { iframeToken } = await this.paytrProvider.createIframeToken({
      merchantOid,
      email:         consultant.email,
      paymentAmount: Math.round(Number(pkg.price_monthly) * 100),
      basketItems: [{
        name:  pkg.label_tr,
        price: String(pkg.price_monthly),
        count: 1,
      }],
      userIp:      params.ip || '127.0.0.1',
      userName:    consultant.full_name || 'Consultant',
      userAddress: params.billing_address || 'Türkiye',
      userPhone:   params.phone || '05000000000',
    });

    await this.paymentRepository.save({
      consultant_id:       consultant.id,
      amount:              Number(pkg.price_monthly),
      currency:            'TRY',
      provider:            'paytr',
      provider_payment_id: merchantOid,
      status:              'pending',
      type:                params.type,
      package_key:         params.package_key,
      metadata:            { merchant_oid: merchantOid },
    });

    return { iframe_token: iframeToken, merchant_oid: merchantOid };
  }

  async getSubscription(consultantId: string) {
    const sub = await this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' },
      relations: ['package'],
    });

    if (!sub) return null;

    const price = sub.interval === 'yearly' ? sub.package?.price_yearly : sub.package?.price_monthly;
    
    // Debug log (remove in production)
    console.log(`[BillingService] Subscription found for ${consultantId}:`, {
      interval: sub.interval,
      package:  sub.package_key,
      price:    price,
      currency: sub.package?.currency
    });

    return {
      ...sub,
      package_label: sub.package?.label_tr || sub.package_key.toUpperCase(),
      price: price,
      currency: sub.package?.currency || 'TRY'
    };
  }

  async subscribe(consultantId: string, packageKey: string, interval: 'monthly' | 'yearly', provider: string) {
    const pkg = await this.packageService.findOne(packageKey);
    return {
      message: 'Subscription initialized',
      package: pkg,
      interval,
      provider
    };
  }

  async handlePaymentSuccess(consultantId: string, packageKey: string, provider: string, providerPaymentId: string, amount: number, interval?: string) {
    const pkg = await this.packageService.findOne(packageKey);

    return this.dataSource.transaction(async (manager) => {
      // 1. Create/Update payment record
      let payment = await manager.findOne(Payment, { where: { provider_payment_id: providerPaymentId } });
      if (!payment) {
        payment = manager.create(Payment, {
          consultant_id: consultantId,
          amount,
          currency: pkg.currency,
          status: 'completed',
          provider,
          provider_payment_id: providerPaymentId
        });
      } else {
        payment.status = 'completed';
      }
      await manager.save(payment);

      if (pkg.type === 'subscription') {
        const existingSub = await manager.findOne(Subscription, {
          where: { consultant_id: consultantId, status: 'active' }
        });

        if (existingSub) {
          existingSub.status = 'expired';
          await manager.save(existingSub);
        }

        const now = new Date();
        const endDate = new Date();
        if (interval === 'yearly') {
          endDate.setFullYear(now.getFullYear() + 1);
        } else {
          endDate.setMonth(now.getMonth() + 1);
        }

        // Kayıtlı ödeme yöntemini bul
        const paymentMethod = await manager.findOne(ConsultantPaymentMethod, {
          where: { consultant_id: consultantId, provider, is_default: true }
        });

        const sub = manager.create(Subscription, {
          consultant_id: consultantId,
          package_key: pkg.key,
          status: 'active',
          interval: interval || 'monthly',
          current_period_start: now,
          current_period_end: endDate,
          provider,
          provider_subscription_id: providerPaymentId,
          // Auto-charge alanları
          stripe_customer_id:       paymentMethod?.stripe_customer_id,
          stripe_payment_method_id: paymentMethod?.stripe_payment_method_id,
        });
        await manager.save(sub);

        // 4. Update Consultant Plan Limits
        const plan = await manager.findOne(ConsultantPlan, { where: { consultant_id: consultantId } });
        const planData = {
          plan:          pkg.key,
          max_companies: pkg.max_companies ?? 5,
          max_employees: pkg.max_employees ?? 100,
          ai_enabled:    pkg.ai_enabled,
          white_label:   pkg.white_label,
          valid_until:   endDate,
          is_active:     true,
        };

        if (plan) {
          await manager.update(ConsultantPlan, { consultant_id: consultantId }, planData);
        } else {
          const newPlan = manager.create(ConsultantPlan, {
            consultant_id: consultantId,
            ...planData,
          });
          await manager.save(newPlan);
        }
      }

      for (const [typeKey, creditAmount] of Object.entries(pkg.credits)) {
        await this.creditService.addCredits(
          consultantId,
          typeKey,
          creditAmount,
          pkg.type === 'subscription' ? 'reset' : 'purchase',
          `${pkg.label_tr} Paketi Yüklemesi`,
          payment.id
        );
      }

      // Ödeme başarılı → fatura üret → mail gönder
      try {
        const consultant = await manager.findOne(User, { where: { id: consultantId } });
        if (consultant) {
          await this.invoiceService.generateInvoice(payment.id);

          await this.notificationService.sendEmail(
            consultant.email,
            'invoice_ready',
            {
              full_name:      consultant.full_name,
              invoice_number: `INV-${new Date().getFullYear()}-${payment.id.slice(-6).toUpperCase()}`,
              amount:         `${amount} ${pkg.currency}`,
              invoice_url:    `${process.env.APP_URL}/api/v1/consultant/billing/invoices/${payment.id}/download`,
              date:           new Date().toLocaleDateString('tr-TR'),
            }
          );
        }
      } catch (err) {
        this.logger.error('Fatura üretimi/mail gönderimi başarısız', { service: 'BillingService', userId: consultantId }, err);
      }

      return { success: true };
    });
  }

  async activatePackageById(consultantId: string, packageKey: string) {
    const pkg = await this.packageService.findOne(packageKey);
    // Find last payment to get provider info if needed, but we can just use package
    const lastPayment = await this.paymentRepository.findOne({
      where: { consultant_id: consultantId, package_key: packageKey },
      order: { created_at: 'DESC' }
    });
    
    if (!lastPayment) return;
    
    return this.handlePaymentSuccess(
      consultantId, 
      packageKey, 
      lastPayment.provider, 
      lastPayment.provider_payment_id, 
      Number(lastPayment.amount)
    );
  }

  async getInvoices(consultantId: string) {
    return this.paymentRepository.find({
      where: { consultant_id: consultantId, status: 'completed' },
      order: { created_at: 'DESC' }
    });
  }

  async cancelSubscription(consultantId: string) {
    const sub = await this.getSubscription(consultantId);
    if (!sub) {
      throw new NotFoundException('Aktif abonelik bulunamadı.');
    }

    sub.cancel_at_period_end = true;
    return this.subscriptionRepository.save(sub);
  }

  async getAdminStats() {
    const revenueRes = await this.paymentRepository.query(`
      SELECT SUM(amount) as total FROM payments WHERE status = 'completed'
    `);
    
    const activeSubs = await this.subscriptionRepository.count({
      where: { status: 'active' }
    });

    const activeCredits = await this.creditService.getTotalActiveCredits();
    
    // Fetch Platform Settings for mail quota
    const settings = await this.dataSource.query(`SELECT mail_quota_capacity, mail_quota_used FROM platform_settings LIMIT 1`);
    const mailConfig = settings[0] || { mail_quota_capacity: 3000, mail_quota_used: 0 };

    // External Quotas
    let mailQuota = {
      remaining: (mailConfig?.mail_quota_capacity || 3000) - (mailConfig?.mail_quota_used || 0),
      total: mailConfig?.mail_quota_capacity || 3000
    };

    try {
      if (this.notificationService && typeof this.notificationService.getMailQuota === 'function') {
        const quotaRes = await this.notificationService.getMailQuota();
        if (quotaRes && quotaRes.success !== false && quotaRes.total !== undefined) {
          mailQuota = quotaRes;
        }
      }
    } catch (err) {
      console.error('[BillingService] Quota fetch failed:', err.message);
    }

    return {
      monthly_revenue: parseFloat(revenueRes[0]?.total || 0),
      new_subscriptions: activeSubs,
      active_credits: activeCredits,
      revenue_change: '+12%',
      subs_change: '+5',
      external_quotas: {
        mail: mailQuota
      }
    };
  }

  async getRecentTransactions(limit: number = 10) {
    const takeValue = Number(limit) || 10;
    return this.paymentRepository.find({
      take: takeValue,
      order: { created_at: 'DESC' },
      relations: ['consultant']
    });
  }

  async consumeCredits(consultantId: string, typeKey: string, amount: number, description?: string) {
    const ctx = { userId: consultantId };
    this.debug.start('consumeCredits', ctx, { typeKey, amount });

    try {
      const result = await this.creditService.deductCredits(
        consultantId,
        typeKey,
        amount,
        description || `AI Hizmet Kullanımı: ${typeKey}`
      );

      // Bakiye kontrolü ve bildirim (Opsiyonel: %20 altına düşünce uyar)
      const balances = await this.creditService.getBalances(consultantId);
      const balance  = balances.find(b => b.key === typeKey);
      
      if (balance && balance.balance !== -1 && balance.package_amount > 0) {
        const ratio = balance.balance / balance.package_amount;
        if (ratio < 0.2) {
          await this.inAppNotifService.create({
            userId:  consultantId,
            type:    'low_credit_warning',
            titleTr: `Kredi uyarısı: ${balance.label_tr}`,
            titleEn: `Credit warning: ${balance.label_en}`,
            bodyTr:  `Kalan krediniz %20'nin altına düştü (${balance.balance}).`,
            bodyEn:  `Remaining credits below 20% (${balance.balance}).`,
            link:    `/consultant/billing`,
            metadata: { type_key: typeKey, balance: balance.balance },
          });
        }
      }

      this.debug.done('consumeCredits', ctx, { success: true });
      return result;
    } catch (err) {
      this.debug.fail('consumeCredits', ctx, err);
      throw err;
    }
  }
}
