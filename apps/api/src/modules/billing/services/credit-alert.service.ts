import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreditBalance } from '../entities/credit-balance.entity';
import { CreditType } from '../entities/credit-type.entity';
import { CreditTransaction } from '../entities/credit-transaction.entity';
import { User } from '../../user/entities/user.entity';
import { NotificationService } from '../../notification/notification.service';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class CreditAlertService {
  constructor(
    @InjectRepository(CreditBalance)     private readonly balanceRepo:  Repository<CreditBalance>,
    @InjectRepository(CreditType)        private readonly typeRepo:     Repository<CreditType>,
    @InjectRepository(CreditTransaction) private readonly txRepo:       Repository<CreditTransaction>,
    @InjectRepository(User)              private readonly userRepo:     Repository<User>,
    private readonly notificationService: NotificationService,
    @Inject(CACHE_MANAGER)               private readonly cacheManager: Cache,
    private readonly logger:              AppLogger,
  ) {}

  // Her gün 10:00 CRON tarafından çağrılır
  async checkLowBalances(): Promise<{ alerted: number }> {
    const ctx = { service: 'CreditAlertService' };
    this.logger.info('Düşük bakiye kontrolü başladı', ctx);

    // Bakiyesi olan tüm consultant'ları çek
    const balances = await this.balanceRepo
      .createQueryBuilder('cb')
      .leftJoinAndSelect('cb.creditType', 'ct')
      .where('cb.balance > 0')   // -1 (sınırsız) ve 0 hariç
      .andWhere('cb.balance != -1')
      .getMany();

    let alerted = 0;

    for (const balance of balances) {
      try {
        const alertSent = await this.checkAndAlert(balance);
        if (alertSent) alerted++;
      } catch (err) {
        this.logger.error('Bakiye uyarı hatası', ctx, {
          consultantId: balance.consultant_id, error: err.message
        });
      }
    }

    this.logger.info('Düşük bakiye kontrolü tamamlandı', ctx, {
      checked: balances.length, alerted
    });

    return { alerted };
  }

  private async checkAndAlert(balance: CreditBalance): Promise<boolean> {
    // Başlangıç bakiyesini bulmak için
    // credit_transactions'tan son subscription_renew'i bul
    const lastRenew = await this.txRepo
      .createQueryBuilder('tx')
      .where('tx.consultant_id = :id', { id: balance.consultant_id })
      .andWhere('tx.credit_type_key = :key', { key: balance.credit_type_key })
      .andWhere('tx.type = :type', { type: 'reset' }) // subscription_renew tipi bizde 'reset' olarak geçiyor
      .orderBy('tx.created_at', 'DESC')
      .getOne();

    const initialBalance = lastRenew ? Math.abs(Number(lastRenew.amount)) : 1000; // fallback
    const currentBalance = Number(balance.balance);
    const ratio = currentBalance / initialBalance;

    // %20 altı → uyarı
    const LOW_THRESHOLD = 0.20;
    if (ratio >= LOW_THRESHOLD) return false;

    // Bu uyarı bugün zaten gönderildi mi? (Redis cache)
    const cacheKey = `credit_alert:${balance.consultant_id}:${balance.credit_type_key}`;
    const alreadySent = await this.cacheManager.get(cacheKey);
    if (alreadySent) return false;

    // Kullanıcı bilgisi
    const consultant = await this.userRepo.findOne({
      where: { id: balance.consultant_id }
    });
    if (!consultant) return false;

    const creditType = await this.typeRepo.findOne({
      where: { key: balance.credit_type_key }
    });

    this.logger.warn('Düşük bakiye uyarısı gönderiliyor', { service: 'CreditAlertService' }, {
      consultantId:  balance.consultant_id,
      creditType:    balance.credit_type_key,
      balance:       currentBalance,
      ratio:         Math.round(ratio * 100),
    });

    // Mail gönder
    await this.notificationService.sendEmail(
      consultant.email,
      'low_credit_warning',
      {
        full_name:        consultant.full_name,
        credit_type_name: creditType?.label_tr ?? balance.credit_type_key,
        balance:          String(currentBalance),
        percentage:       String(Math.round(ratio * 100)),
        purchase_url:     `${process.env.APP_URL}/consultant/billing?tab=purchase`,
      }
    );

    // 24 saat boyunca tekrar gönderme
    await this.cacheManager.set(cacheKey, '1', 86400 * 1000); // milliseconds if using nestjs cache manager v5+

    return true;
  }
}
