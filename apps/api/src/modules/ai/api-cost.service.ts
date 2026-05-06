import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { AppLogger } from '../../common/logger/app-logger.service';
import { SettingsService } from '../settings/settings.service';
import { ProductPackage } from '../billing/entities/product-package.entity';

@Injectable()
export class ApiCostService {
  constructor(
    @InjectRepository(ApiCostLog)
    private readonly costLogRepo: Repository<ApiCostLog>,
    @InjectRepository(ProductPackage)
    private readonly packageRepo: Repository<ProductPackage>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly settingsService: SettingsService,
    private readonly logger: AppLogger,
  ) {}

  // Model fiyatlarını platform_settings'ten al (cache'li)
  private async getModelPrices(): Promise<Record<string, { input: number; output: number }>> {
    const cacheKey = 'model_prices';
    const cached   = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const settings = await this.settingsService.getSettings(false);
    const prices   = settings?.ai_task_models?.model_prices ?? {};

    // Cache: 1 saat
    await this.cacheManager.set(cacheKey, prices, 3600 * 1000); // cache-manager v5+ uses ms
    return prices;
  }

  // Maliyet hesapla ve logla
  async logAiCall(params: {
    consultantId?:  string;
    companyId?:     string;
    taskType:       string;
    provider:       string;
    model:          string;
    inputTokens:    number;
    outputTokens:   number;
    durationMs?:    number;
    aiInsightId?:   string;
    creditTxId?:    string;
    creditAmount?:  number;  // kaç kredi harcandı
  }): Promise<{ costUsd: number; revenueTry: number }> {

    const prices    = await this.getModelPrices();
    const modelKey  = params.model;
    const modelPrice = prices[modelKey];

    // Maliyet hesapla (1,000,000 token başına fiyat)
    let costUsd = 0;
    if (modelPrice) {
      costUsd = (params.inputTokens  / 1000000 * modelPrice.input)
              + (params.outputTokens / 1000000 * modelPrice.output);
    } else {
      this.logger.warn('Model fiyatı bulunamadı', { service: 'ApiCostService' }, {
        model: params.model
      });
    }

    // Gelir hesapla: consultant'ın ödediği tutar
    // credit_amount * platform'un AI kredi satış fiyatı
    // Örn: 10 AI kredi * 0.35 TRY/kredi = 3.50 TRY
    const aiCreditPriceTry = await this.getAiCreditPriceTry();
    const revenueTry = (params.creditAmount ?? 0) * aiCreditPriceTry;

    // Log kaydet
    const log = this.costLogRepo.create({
      consultant_id:  params.consultantId,
      company_id:     params.companyId,
      task_type:      params.taskType,
      provider:       params.provider,
      model:          params.model,
      input_tokens:   params.inputTokens,
      output_tokens:  params.outputTokens,
      cost_usd:       costUsd,
      revenue_try:    revenueTry,
      ai_insight_id:  params.aiInsightId,
      credit_tx_id:   params.creditTxId,
      duration_ms:    params.durationMs,
    });

    await this.costLogRepo.save(log);

    this.logger.debug('AI maliyet loglandı', { service: 'ApiCostService' }, {
      taskType:    params.taskType,
      model:       params.model,
      inputTokens:  params.inputTokens,
      outputTokens: params.outputTokens,
      costUsd:      costUsd.toFixed(6),
      revenueTry:   revenueTry.toFixed(2),
    });

    return { costUsd, revenueTry };
  }

  // AI kredi başına TRY fiyatı
  // Örn: 1000 AI kredi = 349 TRY → 1 kredi = 0.349 TRY
  private async getAiCreditPriceTry(): Promise<number> {
    const pkg = await this.packageRepo.findOne({
      where: { key: 'ai_credit_1000' }
    });
    if (!pkg) return 0.35; // fallback
    const credits = (pkg.credits as any)?.ai_credit ?? 1000;
    return Number(pkg.price_monthly) / credits;
  }

  // Admin dashboard için özet istatistikler
  async getStats(params: {
    startDate?: Date;
    endDate?:   Date;
    groupBy?:   'day' | 'month' | 'provider' | 'model' | 'task';
  }) {
    const qb = this.costLogRepo.createQueryBuilder('c');

    if (params.startDate) {
      qb.andWhere('c.created_at >= :start', { start: params.startDate });
    }
    if (params.endDate) {
      qb.andWhere('c.created_at <= :end', { end: params.endDate });
    }

    switch (params.groupBy) {
      case 'day':
        return qb
          .select("DATE_TRUNC('day', c.created_at)", 'date')
          .addSelect('SUM(c.cost_usd)',      'total_cost_usd')
          .addSelect('SUM(c.revenue_try)',   'total_revenue_try')
          .addSelect('SUM(c.input_tokens + c.output_tokens)',  'total_tokens')
          .addSelect('COUNT(*)',             'call_count')
          .groupBy("DATE_TRUNC('day', c.created_at)")
          .orderBy('date', 'DESC')
          .getRawMany();

      case 'model':
        return qb
          .select('c.provider',           'provider')
          .addSelect('c.model',            'model')
          .addSelect('SUM(c.cost_usd)',    'total_cost_usd')
          .addSelect('SUM(c.revenue_try)', 'total_revenue_try')
          .addSelect('SUM(c.input_tokens + c.output_tokens)','total_tokens')
          .addSelect('COUNT(*)',           'call_count')
          .addSelect('AVG(c.cost_usd)',    'avg_cost_usd')
          .groupBy('c.provider, c.model')
          .orderBy('total_cost_usd', 'DESC')
          .getRawMany();

      case 'task':
        return qb
          .select('c.task_type',           'task_type')
          .addSelect('SUM(c.cost_usd)',    'total_cost_usd')
          .addSelect('SUM(c.revenue_try)', 'total_revenue_try')
          .addSelect('COUNT(*)',           'call_count')
          .addSelect('AVG(c.input_tokens + c.output_tokens)','avg_tokens')
          .groupBy('c.task_type')
          .orderBy('total_cost_usd', 'DESC')
          .getRawMany();

      default:
        // Genel özet
        return qb
          .select('SUM(c.cost_usd)',      'total_cost_usd')
          .addSelect('SUM(c.revenue_try)', 'total_revenue_try')
          .addSelect('SUM(c.input_tokens + c.output_tokens)','total_tokens')
          .addSelect('COUNT(*)',           'call_count')
          .addSelect('AVG(c.cost_usd)',    'avg_cost_per_call')
          .getRawOne();
    }
  }

  // Consultant bazlı maliyet
  async getConsultantStats(consultantId: string, month?: string) {
    const qb = this.costLogRepo.createQueryBuilder('c')
      .where('c.consultant_id = :id', { id: consultantId });

    if (month) {
      qb.andWhere("TO_CHAR(c.created_at, 'YYYY-MM') = :month", { month });
    }

    return qb
      .select('c.task_type',           'task_type')
      .addSelect('SUM(c.cost_usd)',    'cost_usd')
      .addSelect('SUM(c.revenue_try)', 'revenue_try')
      .addSelect('SUM(c.input_tokens + c.output_tokens)','total_tokens')
      .addSelect('COUNT(*)',           'call_count')
      .groupBy('c.task_type')
      .orderBy('cost_usd', 'DESC')
      .getRawMany();
  }
}
