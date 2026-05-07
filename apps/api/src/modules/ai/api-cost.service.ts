import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiCostLog } from './entities/api-cost-log.entity';
import { PlatformSettings } from '../settings/entities/platform-settings.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { ProductPackage } from '../billing/entities/product-package.entity';
import { ExchangeRateService } from '../../common/utils/exchange-rate.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class ApiCostService {
  constructor(
    @InjectRepository(ApiCostLog)
    private readonly costLogRepo: Repository<ApiCostLog>,
    @InjectRepository(PlatformSettings)
    private readonly settingsRepo: Repository<PlatformSettings>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(ProductPackage)
    private readonly packageRepo: Repository<ProductPackage>,
    private readonly exchangeRateService: ExchangeRateService,
    private readonly logger: AppLogger,
  ) {}

  // ── Model fiyatını getir ──────────────────────────────────────
  async getModelPrice(model: string): Promise<{
    input: number;
    output: number;
    provider: string;
  } | null> {
    const settings   = await this.settingsRepo.findOne({ where: {} });
    const prices     = (settings?.ai_task_models as any)?.model_prices ?? {};

    // Tam eşleşme
    if (prices[model]) return prices[model];

    // Prefix eşleşme (claude-sonnet-4-6-20251001 → claude-sonnet-4-6)
    const baseModel = Object.keys(prices).find(k =>
      model.startsWith(k) || k.startsWith(model)
    );
    if (baseModel) return prices[baseModel];

    this.logger.warn('Model fiyatı bulunamadı', {
      service: 'ApiCostService'
    }, { model });
    return null;
  }

  // ── Maliyet hesapla ───────────────────────────────────────────
  calculateCost(
    modelPrice: { input: number; output: number } | null,
    inputTokens:  number,
    outputTokens: number,
  ): number {
    if (!modelPrice) return 0;
    return (inputTokens  * modelPrice.input  / 1_000_000)
         + (outputTokens * modelPrice.output / 1_000_000);
  }

  // ── Gelir hesapla ─────────────────────────────────────────────
  async calculateRevenue(
    consultantId:  string,
    creditAmount:  number,
  ): Promise<number> {
    if (!consultantId || creditAmount <= 0) return 0;

    const subscription = await this.subscriptionRepo.findOne({
      where: { consultant_id: consultantId, status: 'active' }
    });
    if (!subscription) return 0;

    const pkg = await this.packageRepo.findOne({
      where: { key: subscription.package_key }
    });
    if (!pkg?.price_monthly || !pkg?.credits) return 0;

    const totalCredits   = (pkg.credits as any)?.ai_credit ?? 500;
    const pricePerCredit = pkg.price_monthly / totalCredits; // USD
    return pricePerCredit * creditAmount; // USD
  }

  // ── Ana log metodu ────────────────────────────────────────────
  async logAiCall(params: {
    model:         string;
    taskType:      string;
    consultantId?: string;
    companyId?:    string;
    inputTokens:   number;
    outputTokens:  number;
    creditAmount?: number;  // kaç AI kredisi harcandı
    durationMs?:   number;
    aiInsightId?:  string;
  }): Promise<{ costUsd: number; revenueTry: number }> {

    // 1. Model fiyatını al
    const modelPrice = await this.getModelPrice(params.model);

    // 2. Maliyet hesapla
    const costUsd = this.calculateCost(
      modelPrice, params.inputTokens, params.outputTokens
    );

    // 3. USD/TRY kuru
    const usdTryRate = await this.exchangeRateService.getUsdTry();
    const costTry    = costUsd * usdTryRate;

    // 4. Gelir hesapla
    const revenueUsd = params.consultantId && params.creditAmount
      ? await this.calculateRevenue(params.consultantId, params.creditAmount)
      : 0;
    const revenueTry = revenueUsd * usdTryRate;

    // 5. Logla
    await this.costLogRepo.save({
      model:         params.model,
      task_type:     params.taskType,
      consultant_id: params.consultantId,
      company_id:    params.companyId,
      input_tokens:  params.inputTokens,
      output_tokens: params.outputTokens,
      cost_usd:      costUsd,
      cost_try:      costTry,
      revenue_try:   revenueTry,
      credit_amount: params.creditAmount ?? 0,
      usd_try_rate:  usdTryRate,
      provider:      modelPrice?.provider ?? 'unknown',
      duration_ms:   params.durationMs,
      ai_insight_id: params.aiInsightId,
    });

    this.logger.debug('AI maliyet loglandı', { service: 'ApiCostService' }, {
      model:       params.model,
      costUsd:     costUsd.toFixed(6),
      revenueTry:  revenueTry.toFixed(2),
      creditAmount: params.creditAmount ?? 0,
      margin:      revenueUsd > 0
        ? `%${((1 - costUsd / revenueUsd) * 100).toFixed(1)}`
        : 'N/A',
    });

    return { costUsd, revenueTry };
  }

  // ── Admin analytics için özet ─────────────────────────────────
  async getMonthlySummary(year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 0, 23, 59, 59);

    const rows = await this.costLogRepo
      .createQueryBuilder('l')
      .select([
        'l.model                          as model',
        'l.provider                       as provider',
        'COUNT(*)                         as calls',
        'SUM(l.input_tokens + l.output_tokens) as total_tokens',
        'SUM(l.cost_usd)                  as total_cost_usd',
        'SUM(l.revenue_try)               as total_revenue_try',
        'SUM(l.cost_try)                  as total_cost_try',
        'AVG(l.usd_try_rate)              as avg_rate',
      ])
      .where('l.created_at BETWEEN :from AND :to', { from, to })
      .groupBy('l.model, l.provider')
      .orderBy('total_cost_usd', 'DESC')
      .getRawMany();

    const totals = {
      total_cost_usd:    rows.reduce((s, r) => s + Number(r.total_cost_usd   ?? 0), 0),
      total_revenue_try: rows.reduce((s, r) => s + Number(r.total_revenue_try ?? 0), 0),
      total_cost_try:    rows.reduce((s, r) => s + Number(r.total_cost_try   ?? 0), 0),
      total_calls:       rows.reduce((s, r) => s + Number(r.calls            ?? 0), 0),
    };

    return { rows, totals };
  }

  // Keep original getStats for compatibility if needed, or update it
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
        return qb
          .select('SUM(c.cost_usd)',      'total_cost_usd')
          .addSelect('SUM(c.revenue_try)', 'total_revenue_try')
          .addSelect('SUM(c.input_tokens + c.output_tokens)','total_tokens')
          .addSelect('COUNT(*)',           'call_count')
          .addSelect('AVG(c.cost_usd)',    'avg_cost_per_call')
          .getRawOne();
    }
  }

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
