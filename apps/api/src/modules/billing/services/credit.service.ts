import { Injectable, NotFoundException, BadRequestException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreditBalance } from '../entities/credit-balance.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { CreditType } from '../entities/credit-type.entity';
import { ErrorCode } from '../../../common/constants/error-codes';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class CreditService {
  private readonly logger = new Logger(CreditService.name);

  constructor(
    @InjectRepository(CreditBalance)
    private readonly balanceRepository: Repository<CreditBalance>,
    @InjectRepository(CreditTransaction)
    private readonly transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(CreditType)
    private readonly creditTypeRepository: Repository<CreditType>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  async getBalances(consultantId: string) {
    // 1. Get active subscription to see package limits
    const sub = await this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' },
      relations: ['package']
    });
    
    const pkgCredits = sub?.package?.credits || {};

    // 2. Get all active credit types
    const activeTypes = await this.creditTypeRepository.find({ where: { is_active: true } });
    
    // 3. Get current balances
    const balances = await this.balanceRepository.find({ where: { consultant_id: consultantId } });
    
    // Map them for easy access
    const balanceMap: Record<string, CreditBalance> = {};
    balances.forEach(b => {
      balanceMap[b.credit_type_key] = b;
    });

    // Ensure all active types have a balance entry (return 0 if missing)
    return activeTypes.map(type => {
      const b = balanceMap[type.key];
      return {
        key: type.key,
        label_tr: type.label_tr,
        label_en: type.label_en,
        icon: type.icon,
        color: type.color,
        balance: b ? b.balance : 0,
        used_this_month: b ? b.used_this_month : 0,
        package_amount: pkgCredits[type.key] || 0, // Paketten gelen aylık limit
        last_reset_at: b ? b.last_reset_at : null
      };
    });
  }

  async deductCredits(
    consultantId: string, 
    creditTypeKey: string, 
    amount: number, 
    description: string, 
    companyId?: string, 
    referenceId?: string
  ) {
    if (amount <= 0) return;

    return this.dataSource.transaction(async (manager) => {
      let balance = await manager.findOne(CreditBalance, {
        where: { consultant_id: consultantId, credit_type_key: creditTypeKey },
        lock: { mode: 'pessimistic_write' }
      });

      // If no balance record, assume 0 (unless we want to auto-create, but typically users need to buy/subscribe first)
      if (!balance) {
        throw new HttpException({
          error: {
            code: ErrorCode.INSUFFICIENT_CREDITS,
            message: 'Krediniz yetersiz. Lütfen ek kredi satın alın.',
            details: {
              credit_type: creditTypeKey,
              required: amount,
              available: 0,
              purchase_url: '/consultant/billing?tab=purchase',
            },
          },
        }, HttpStatus.PAYMENT_REQUIRED);
      }

      // Check for unlimited
      if (balance.balance === -1) {
        // Just log the transaction as usage but don't deduct
        await manager.save(CreditTransaction, {
          consultant_id: consultantId,
          credit_type_key: creditTypeKey,
          amount: -amount,
          type: 'usage',
          description,
          company_id: companyId,
          reference_id: referenceId
        });
        
        balance.used_this_month += amount;
        await manager.save(balance);
        return;
      }

      if (balance.balance < amount) {
        throw new HttpException({
          error: {
            code: ErrorCode.INSUFFICIENT_CREDITS,
            message: 'Krediniz yetersiz. Lütfen ek kredi satın alın.',
            details: {
              credit_type: creditTypeKey,
              required: amount,
              available: balance.balance,
              purchase_url: '/consultant/billing?tab=purchase',
            },
          },
        }, HttpStatus.PAYMENT_REQUIRED);
      }

      // Deduct
      balance.balance -= amount;
      balance.used_this_month += amount;
      await manager.save(balance);

      // Create transaction
      await manager.save(CreditTransaction, {
        consultant_id: consultantId,
        credit_type_key: creditTypeKey,
        amount: -amount,
        type: 'usage',
        description,
        company_id: companyId,
        reference_id: referenceId
      });
    });
  }

  async addCredits(
    consultantId: string, 
    creditTypeKey: string, 
    amount: number, 
    type: 'purchase' | 'bonus' | 'reset', 
    description: string,
    referenceId?: string
  ) {
    return this.dataSource.transaction(async (manager) => {
      let balance = await manager.findOne(CreditBalance, {
        where: { consultant_id: consultantId, credit_type_key: creditTypeKey },
        lock: { mode: 'pessimistic_write' }
      });

      if (!balance) {
        balance = manager.create(CreditBalance, {
          consultant_id: consultantId,
          credit_type_key: creditTypeKey,
          balance: 0
        });
      }

      if (balance.balance === -1 && type !== 'reset') {
        // If already unlimited, skip adding but maybe log bonus/purchase?
        // Usually subscription reset sets it to -1
      } else {
        balance.balance = amount === -1 ? -1 : balance.balance + amount;
      }

      if (type === 'reset') {
        balance.used_this_month = 0;
        balance.last_reset_at = new Date();
      }

      await manager.save(balance);

      await manager.save(CreditTransaction, {
        consultant_id: consultantId,
        credit_type_key: creditTypeKey,
        amount: amount,
        type: type,
        description,
        reference_id: referenceId
      });
    });
  }

  async getUsageStats(consultantId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get active subscription to see real package limits
    const sub = await this.subscriptionRepository.findOne({
      where: { consultant_id: consultantId, status: 'active' },
      relations: ['package']
    });
    const pkgCredits = sub?.package?.credits || {};

    // 1. Get Summary (this month)
    const activeTypes = await this.creditTypeRepository.find({ where: { is_active: true } });
    const balances = await this.balanceRepository.find({ where: { consultant_id: consultantId } });
    
    const summary = activeTypes.map(type => {
      const b = balances.find(bal => bal.credit_type_key === type.key);
      const used = b ? b.used_this_month : 0;
      const total = pkgCredits[type.key] || 0; 
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
      return {
        credit_type_key: type.key,
        label_tr: type.label_tr,
        used,
        total,
        percentage
      };
    });

    // 2. Get Daily Trends (Pivot AI and Mail)
    const dailyRaw = await this.dataSource.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN credit_type_key = 'ai_credit' THEN ABS(amount) ELSE 0 END) as ai_credit,
        SUM(CASE WHEN credit_type_key = 'mail_credit' THEN ABS(amount) ELSE 0 END) as mail_credit
      FROM credit_transactions
      WHERE consultant_id = $1 
        AND type = 'usage'
        AND created_at >= $2
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, [consultantId, thirtyDaysAgo]);

    // 3. Get Company Breakdown
    const companyUsage = await this.dataSource.query(`
      SELECT 
        c.name as company_name,
        SUM(CASE WHEN t.credit_type_key = 'ai_credit' THEN ABS(t.amount) ELSE 0 END) as ai_used,
        SUM(CASE WHEN t.credit_type_key = 'mail_credit' THEN ABS(t.amount) ELSE 0 END) as mail_used
      FROM credit_transactions t
      LEFT JOIN companies c ON t.company_id = c.id
      WHERE t.consultant_id = $1 
        AND t.type = 'usage'
        AND t.created_at >= $2
        AND t.company_id IS NOT NULL
      GROUP BY c.name
    `, [consultantId, thirtyDaysAgo]);

    // 4. Get Recent Transactions
    const transactions = await this.transactionRepository.find({
      where: { consultant_id: consultantId },
      order: { created_at: 'DESC' },
      take: 50,
      relations: ['company']
    });

    return {
      summary,
      daily: dailyRaw,
      by_company: companyUsage,
      transactions: transactions.map(t => ({
        date: t.created_at,
        type: t.type,
        amount: t.amount,
        credit_type: t.credit_type_key,
        description: t.description,
        company_name: t.company?.name || '-'
      }))
    };
  }

  async getTotalActiveCredits() {
    const res = await this.dataSource.query(`
      SELECT credit_type_key as key, SUM(balance) as total 
      FROM credit_balances 
      WHERE balance > 0 OR balance = -1
      GROUP BY credit_type_key
    `);
    
    const breakdown: Record<string, number> = {};
    res.forEach((r: any) => {
      breakdown[r.key] = parseFloat(r.total);
    });
    
    return breakdown;
  }
}
