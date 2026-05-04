import { Injectable, Logger, NotFoundException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { ProductPackage } from '../entities/product-package.entity';
import { PackageService } from './package.service';
import { CreditService } from './credit.service';
import { StripeProvider } from '../providers/stripe.provider';
import { IyzicoProvider } from '../providers/iyzico.provider';
import { PaytrProvider } from '../providers/paytr.provider';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { User } from '../../user/entities/user.entity';
import { AppLogger } from '../../../common/logger/app-logger.service';
import { ServiceDebugger } from '../../../common/logger/debug.helper';

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
    private readonly packageService: PackageService,
    private readonly creditService: CreditService,
    private readonly stripeProvider: StripeProvider,
    private readonly iyzicoProvider: IyzicoProvider,
    private readonly paytrProvider: PaytrProvider,
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.debug = new ServiceDebugger(logger, 'BillingService');
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

        case 'iyzico':
          this.debug.step('createPayment', 'iyzico ödeme başlatılıyor', ctx);
          result = await this.handleIyzicoPayment(params, consultant);
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

  // ── iyzico ödeme handler ──────────────────────────────────────────
  private async handleIyzicoPayment(params: CreatePaymentDto, consultant: User) {
    const pkg = await this.packageRepository.findOne({
      where: { key: params.package_key }
    });
    if (!pkg) throw new NotFoundException('Package not found');

    if (!params.payment_card) throw new BadRequestException('Kart bilgileri eksik');

    const result = await this.iyzicoProvider.createPayment({
      price:       String(pkg.price_monthly),
      paidPrice:   String(pkg.price_monthly),
      currency:    'TRY',
      installment: 1,
      paymentCard: params.payment_card,
      buyer: {
        id:                  consultant.id,
        name:                consultant.full_name?.split(' ')[0] || 'Consultant',
        surname:             consultant.full_name?.split(' ').slice(1).join(' ') || '-',
        email:               consultant.email,
        identityNumber:      params.identity_number || '11111111111',
        registrationAddress: params.billing_address || 'Türkiye',
        ip:                  params.ip || '127.0.0.1',
        city:                params.city || 'İstanbul',
        country:             'Turkey',
      },
      billingAddress: {
        contactName: consultant.full_name || 'Consultant',
        city:        params.city || 'İstanbul',
        country:     'Turkey',
        address:     params.billing_address || 'Türkiye',
      },
      basketItems: [{
        id:        pkg.key,
        name:      pkg.label_tr,
        category1: 'Software',
        itemType:  'VIRTUAL',
        price:     String(pkg.price_monthly),
      }],
    });

    if (result.status !== 'success') {
      throw new BadRequestException(result.errorMessage || 'Ödeme başarısız');
    }

    await this.paymentRepository.save({
      consultant_id:       consultant.id,
      amount:              Number(pkg.price_monthly),
      currency:            'TRY',
      provider:            'iyzico',
      provider_payment_id: result.paymentId,
      status:              'completed',
      type:                params.type,
      package_key:         params.package_key,
    });

    await this.handlePaymentSuccess(consultant.id, pkg.key, 'iyzico', result.paymentId || '', Number(pkg.price_monthly));

    return { success: true, payment_id: result.paymentId };
  }

  // ── PayTR ödeme handler ───────────────────────────────────────────
  private async handlePaytrPayment(params: CreatePaymentDto, consultant: User) {
    const pkg = await this.packageRepository.findOne({
      where: { key: params.package_key }
    });
    if (!pkg) throw new NotFoundException('Package not found');

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
    return this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' },
      relations: ['package'],
    });
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

  async handlePaymentSuccess(consultantId: string, packageKey: string, provider: string, providerPaymentId: string, amount: number) {
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
        endDate.setMonth(now.getMonth() + 1);

        const sub = manager.create(Subscription, {
          consultant_id: consultantId,
          package_key: pkg.key,
          status: 'active',
          interval: 'monthly',
          current_period_start: now,
          current_period_end: endDate,
          provider,
          provider_subscription_id: providerPaymentId
        });
        await manager.save(sub);
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

    return {
      monthly_revenue: parseFloat(revenueRes[0]?.total || 0),
      new_subscriptions: activeSubs,
      active_credits: activeCredits,
      revenue_change: '+12%',
      subs_change: '+5',
    };
  }

  async getRecentTransactions(limit: number) {
    return this.paymentRepository.find({
      relations: ['consultant'],
      order: { created_at: 'DESC' },
      take: limit,
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
      this.debug.done('consumeCredits', ctx, { success: true });
      return result;
    } catch (err) {
      this.debug.fail('consumeCredits', ctx, err);
      throw err;
    }
  }
}
