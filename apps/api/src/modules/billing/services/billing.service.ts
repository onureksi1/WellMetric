import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { Payment } from '../entities/payment.entity';
import { ProductPackage } from '../entities/product-package.entity';
import { PackageService } from './package.service';
import { CreditService } from './credit.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly packageService: PackageService,
    private readonly creditService: CreditService,
    private readonly dataSource: DataSource,
  ) {}

  async getSubscription(consultantId: string) {
    return this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' },
      relations: ['package'],
    });
  }

  async subscribe(consultantId: string, packageKey: string, interval: 'monthly' | 'yearly', provider: string) {
    const pkg = await this.packageService.findOne(packageKey);
    
    // In a real scenario, we would initialize payment with the provider here
    // and return a client secret or redirect URL.
    
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
      // 1. Create payment record
      const payment = manager.create(Payment, {
        consultant_id: consultantId,
        amount,
        currency: pkg.currency,
        status: 'completed',
        provider,
        provider_payment_id: providerPaymentId
      });
      await manager.save(payment);

      if (pkg.type === 'subscription') {
        // 2. Handle subscription
        const existingSub = await manager.findOne(Subscription, {
          where: { consultant_id: consultantId, status: 'active' }
        });

        if (existingSub) {
          existingSub.status = 'expired'; // Or replaced
          await manager.save(existingSub);
        }

        const now = new Date();
        const endDate = new Date();
        if (payment.metadata?.interval === 'yearly') {
          endDate.setFullYear(now.getFullYear() + 1);
        } else {
          endDate.setMonth(now.getMonth() + 1);
        }

        const sub = manager.create(Subscription, {
          consultant_id: consultantId,
          package_key: pkg.key,
          status: 'active',
          interval: payment.metadata?.interval || 'monthly',
          current_period_start: now,
          current_period_end: endDate,
          provider,
          provider_subscription_id: providerPaymentId // Simple mapping for now
        });
        await manager.save(sub);
      }

      // 3. Add credits
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
    // In a real scenario, notify provider here (Stripe.subscriptions.update)
    
    return this.subscriptionRepository.save(sub);
  }

  // --- Admin Methods ---

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
      new_subscriptions: activeSubs, // Simplified
      active_credits: activeCredits,
      revenue_change: '+12%', // Mocked for now
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
}
