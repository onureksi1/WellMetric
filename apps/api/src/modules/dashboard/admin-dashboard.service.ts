import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { Survey } from '../survey/entities/survey.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { User } from '../user/entities/user.entity';
import { AiInsight } from '../ai/entities/ai-insight.entity';
import { ScoreService } from '../score/score.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);
  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AiInsight)
    private readonly aiInsightRepository: Repository<AiInsight>,
    private readonly scoreService: ScoreService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async getAdminOverview() {
    const cacheKey = 'admin:dashboard:overview';
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const currentPeriod = now.toISOString().slice(0, 7);
    
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevPeriod = prevMonth.toISOString().slice(0, 7);

    // 1. Metrics
    const metrics = await this.getMetrics(currentPeriod, prevPeriod);

    // 2. Monthly Trend
    const monthlyTrend = await this.getMonthlyTrend();

    // 3. Growth Trend
    const growthTrend = await this.getGrowthTrend();

    // 4. Distributions
    const planDistribution = await this.getPlanDistribution();
    const industryDistribution = await this.getIndustryDistribution(currentPeriod);

    // 5. Dimension Averages
    const dimensionAverages = await this.getDimensionAverages(currentPeriod, prevPeriod);

    // 6. Company Health
    const companyHealth = await this.getCompanyHealth(currentPeriod);
    const topCompanies = [...companyHealth]
      .filter(c => c.overall_score !== null)
      .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0))
      .slice(0, 5);
    
    const bottomCompanies = [...companyHealth]
      .filter(c => c.overall_score !== null)
      .sort((a, b) => (a.overall_score || 0) - (b.overall_score || 0))
      .slice(0, 5);

    // 7. Survey Performance
    const surveyPerformance = await this.getSurveyPerformance(currentPeriod);

    // 8. AI Activity
    const aiActivity = await this.getAiActivity(currentPeriod);

    // 9. Sector Comparison
    const sectorComparison = await this.getSectorComparison(currentPeriod);

    // 10. Alerts
    const alerts = await this.getAlerts(currentPeriod);

    // 11. Recent Audit
    const recentAudit = await this.getRecentAudit();

    const data = {
      metrics,
      monthly_trend: monthlyTrend,
      growth_trend: growthTrend,
      plan_distribution: planDistribution,
      industry_distribution: industryDistribution,
      dimension_averages: dimensionAverages,
      company_health: companyHealth,
      top_companies: topCompanies,
      bottom_companies: bottomCompanies,
      survey_performance: surveyPerformance,
      ai_activity: aiActivity,
      sector_comparison: sectorComparison,
      alerts,
      recent_audit: recentAudit,
    };

    await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', 600);
    return data;
  }

  private async getMetrics(currentPeriod: string, prevPeriod: string) {
    const activeCompanies = await this.companyRepository.count({ where: { is_active: true } });
    
    const newThisMonth = await this.companyRepository.createQueryBuilder('c')
      .where('c.created_at >= :start', { start: new Date(currentPeriod + '-01') })
      .getCount();
    
    const newPrevMonth = await this.companyRepository.createQueryBuilder('c')
      .where('c.created_at >= :start AND c.created_at < :end', { 
        start: new Date(prevPeriod + '-01'),
        end: new Date(currentPeriod + '-01')
      })
      .getCount();

    const activeSurveys = await this.surveyRepository.count({ where: { is_active: true } });

    const responsesThisMonth = await this.responseRepository.count({ where: { period: currentPeriod } });
    const responsesPrevMonth = await this.responseRepository.count({ where: { period: prevPeriod } });

    const scores = await this.dataSource.query(`
      SELECT AVG(score) as avg_score FROM wellbeing_scores 
      WHERE period = $1 AND dimension = 'overall' AND segment_type IS NULL
    `, [currentPeriod]);
    
    const scoresPrev = await this.dataSource.query(`
      SELECT AVG(score) as avg_score FROM wellbeing_scores 
      WHERE period = $1 AND dimension = 'overall' AND segment_type IS NULL
    `, [prevPeriod]);

    const participation = await this.dataSource.query(`
      SELECT 
        AVG(rate) as avg_rate
      FROM (
        SELECT 
          sr.company_id, 
          COUNT(*) * 100.0 / NULLIF(uc.total_emp, 0) as rate
        FROM survey_responses sr
        LEFT JOIN (
          SELECT company_id, COUNT(*) as total_emp 
          FROM users 
          WHERE role = 'employee' AND is_active = true 
          GROUP BY company_id
        ) uc ON uc.company_id = sr.company_id
        WHERE sr.period = $1
        GROUP BY sr.company_id, uc.total_emp
      ) t
    `, [currentPeriod]);

    const participationPrev = await this.dataSource.query(`
      SELECT 
        AVG(rate) as avg_rate
      FROM (
        SELECT 
          sr.company_id, 
          COUNT(*) * 100.0 / NULLIF(uc.total_emp, 0) as rate
        FROM survey_responses sr
        LEFT JOIN (
          SELECT company_id, COUNT(*) as total_emp 
          FROM users 
          WHERE role = 'employee' AND is_active = true 
          GROUP BY company_id
        ) uc ON uc.company_id = sr.company_id
        WHERE sr.period = $1
        GROUP BY sr.company_id, uc.total_emp
      ) t
    `, [prevPeriod]);

    const totalEmployees = await this.userRepository.count({ where: { is_active: true, role: 'employee' } });

    const aiInsights = await this.aiInsightRepository.count({
      where: { generated_at: MoreThan(new Date(currentPeriod + '-01')) }
    });

    return {
      active_companies: activeCompanies,
      new_this_month: newThisMonth,
      new_prev_month: newPrevMonth,
      active_surveys: activeSurveys,
      total_responses_this_month: responsesThisMonth,
      total_responses_prev_month: responsesPrevMonth,
      platform_avg_score: parseFloat(scores[0]?.avg_score || 0),
      platform_avg_score_prev: parseFloat(scoresPrev[0]?.avg_score || 0),
      avg_participation_rate: parseFloat(participation[0]?.avg_rate || 0),
      avg_participation_prev: parseFloat(participationPrev[0]?.avg_rate || 0),
      total_employees: totalEmployees,
      ai_insights_this_month: aiInsights
    };
  }

  private async getMonthlyTrend() {
    return this.dataSource.query(`
      WITH RECURSIVE months AS (
        SELECT (CURRENT_DATE - INTERVAL '11 months')::date as month_date
        UNION ALL
        SELECT (month_date + INTERVAL '1 month')::date FROM months WHERE month_date < CURRENT_DATE
      )
      SELECT 
        TO_CHAR(m.month_date, 'YYYY-MM') as month,
        TO_CHAR(m.month_date, 'Mon''YY') as label,
        COALESCE(COUNT(DISTINCT sr.id), 0) as response_count,
        COALESCE(AVG(ws.score), 0) as avg_score,
        COALESCE(COUNT(DISTINCT c.id), 0) as company_count,
        COALESCE(COUNT(DISTINCT CASE WHEN TO_CHAR(c.created_at, 'YYYY-MM') = TO_CHAR(m.month_date, 'YYYY-MM') THEN c.id END), 0) as new_companies
      FROM months m
      CROSS JOIN (SELECT id, created_at FROM companies WHERE is_active = true) c
      LEFT JOIN survey_responses sr ON sr.company_id = c.id AND sr.period = TO_CHAR(m.month_date, 'YYYY-MM')
      LEFT JOIN wellbeing_scores ws ON ws.company_id = c.id AND ws.period = TO_CHAR(m.month_date, 'YYYY-MM') AND ws.dimension = 'overall' AND ws.segment_type IS NULL
      GROUP BY m.month_date
      ORDER BY m.month_date ASC
    `);
  }

  private async getGrowthTrend() {
    return this.dataSource.query(`
      WITH RECURSIVE months AS (
        SELECT (CURRENT_DATE - INTERVAL '5 months')::date as month_date
        UNION ALL
        SELECT (month_date + INTERVAL '1 month')::date FROM months WHERE month_date < CURRENT_DATE
      )
      SELECT 
        TO_CHAR(m.month_date, 'YYYY-MM') as month,
        TO_CHAR(m.month_date, 'Mon''YY') as label,
        (SELECT COUNT(*) FROM companies WHERE created_at <= m.month_date + INTERVAL '1 month - 1 day' AND is_active = true) as company_count,
        (SELECT COUNT(*) FROM users WHERE created_at <= m.month_date + INTERVAL '1 month - 1 day' AND is_active = true AND role = 'employee') as employee_count,
        (SELECT COUNT(*) FROM survey_responses WHERE period = TO_CHAR(m.month_date, 'YYYY-MM')) as response_count
      FROM months m
      ORDER BY m.month_date ASC
    `);
  }

  private async getPlanDistribution() {
    const raw = await this.companyRepository.createQueryBuilder('c')
      .select('c.plan', 'plan')
      .addSelect('COUNT(*)', 'count')
      .where('c.is_active = true')
      .groupBy('c.plan')
      .getRawMany();
    
    const total = raw.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    return raw.map(item => ({
      plan: item.plan,
      count: parseInt(item.count),
      percentage: total > 0 ? (parseInt(item.count) / total) * 100 : 0
    }));
  }

  private async getIndustryDistribution(period: string) {
    return this.dataSource.query(`
      SELECT 
        c.industry,
        i.label_tr as label_tr,
        COUNT(DISTINCT c.id) as company_count,
        COALESCE(AVG(ws.score), 0) as avg_score,
        COALESCE(AVG(participation.rate), 0) as avg_participation
      FROM companies c
      LEFT JOIN industries i ON i.slug = c.industry
      LEFT JOIN wellbeing_scores ws ON ws.company_id = c.id AND ws.period = $1 AND ws.dimension = 'overall' AND ws.segment_type IS NULL
      LEFT JOIN (
        SELECT 
          sr.company_id, 
          COUNT(*) * 100.0 / NULLIF(uc.total_emp, 0) as rate
        FROM survey_responses sr
        LEFT JOIN (
          SELECT company_id, COUNT(*) as total_emp 
          FROM users 
          WHERE role = 'employee' AND is_active = true 
          GROUP BY company_id
        ) uc ON uc.company_id = sr.company_id
        WHERE sr.period = $1
        GROUP BY sr.company_id, uc.total_emp
      ) participation ON participation.company_id = c.id
      WHERE c.is_active = true
      GROUP BY c.industry, i.label_tr
    `, [period]);
  }

  private async getDimensionAverages(currentPeriod: string, prevPeriod: string) {
    return this.dataSource.query(`
      SELECT 
        ws.dimension,
        AVG(ws.score) as avg_score,
        (SELECT AVG(score) FROM wellbeing_scores WHERE dimension = ws.dimension AND period = $2 AND segment_type IS NULL) as prev_avg_score,
        COUNT(DISTINCT ws.company_id) as company_count
      FROM wellbeing_scores ws
      WHERE ws.period = $1 AND ws.dimension != 'overall' AND ws.segment_type IS NULL
      GROUP BY ws.dimension
    `, [currentPeriod, prevPeriod]);
  }

  private async getCompanyHealth(period: string) {
    return this.dataSource.query(`
      SELECT 
        c.id, c.name, c.plan, c.industry,
        ws.score as overall_score,
        participation.rate as participation_rate,
        CASE 
          WHEN ws_prev.score IS NULL THEN 'new'
          WHEN ws.score > ws_prev.score + 2 THEN 'up'
          WHEN ws.score < ws_prev.score - 2 THEN 'down'
          ELSE 'stable'
        END as trend,
        uc.total_emp as employee_count,
        (SELECT MAX(submitted_at) FROM survey_responses WHERE company_id = c.id) as last_survey_date
      FROM companies c
      LEFT JOIN wellbeing_scores ws ON ws.company_id = c.id AND ws.period = $1 AND ws.dimension = 'overall' AND ws.segment_type IS NULL
      LEFT JOIN wellbeing_scores ws_prev ON ws_prev.company_id = c.id AND ws_prev.period = TO_CHAR(($1::date - INTERVAL '1 month'), 'YYYY-MM') AND ws_prev.dimension = 'overall' AND ws_prev.segment_type IS NULL
      LEFT JOIN (
        SELECT company_id, COUNT(*) as total_emp 
        FROM users 
        WHERE role = 'employee' AND is_active = true 
        GROUP BY company_id
      ) uc ON uc.company_id = c.id
      LEFT JOIN (
        SELECT 
          sr.company_id, 
          COUNT(*) * 100.0 / NULLIF(uc2.total_emp, 0) as rate
        FROM survey_responses sr
        LEFT JOIN (
          SELECT company_id, COUNT(*) as total_emp 
          FROM users 
          WHERE role = 'employee' AND is_active = true 
          GROUP BY company_id
        ) uc2 ON uc2.company_id = sr.company_id
        WHERE sr.period = $1
        GROUP BY sr.company_id, uc2.total_emp
      ) participation ON participation.company_id = c.id
      WHERE c.is_active = true
    `, [period + '-01']);
  }

  private async getSurveyPerformance(period: string) {
    const raw = await this.dataSource.query(`
      SELECT 
        COUNT(DISTINCT survey_id) as total_campaigns,
        AVG(rate) as avg_completion
      FROM (
        SELECT 
          sr.survey_id,
          COUNT(*) * 100.0 / NULLIF(uc.total_emp, 0) as rate
        FROM survey_responses sr
        LEFT JOIN (
          SELECT company_id, COUNT(*) as total_emp 
          FROM users 
          WHERE role = 'employee' AND is_active = true 
          GROUP BY company_id
        ) uc ON uc.company_id = sr.company_id
        WHERE sr.period = $1
        GROUP BY sr.survey_id, sr.company_id, uc.total_emp
      ) t
    `, [period]);

    const best = await this.dataSource.query(`
      SELECT 
        c.name as company_name,
        COUNT(*) * 100.0 / NULLIF(uc.total_emp, 0) as completion_rate,
        sr.period
      FROM survey_responses sr
      JOIN companies c ON c.id = sr.company_id
      LEFT JOIN (
        SELECT company_id, COUNT(*) as total_emp 
        FROM users 
        WHERE role = 'employee' AND is_active = true 
        GROUP BY company_id
      ) uc ON uc.company_id = sr.company_id
      WHERE sr.period = $1
      GROUP BY c.id, c.name, sr.period, uc.total_emp
      ORDER BY completion_rate DESC
      LIMIT 1
    `, [period]);

    return {
      total_campaigns_this_month: parseInt(raw[0]?.total_campaigns || 0),
      avg_open_rate: 0, 
      avg_click_rate: 0, 
      avg_completion_rate: parseFloat(raw[0]?.avg_completion || 0),
      best_campaign: best[0] || null
    };
  }

  private async getAiActivity(period: string) {
    const insights = await this.aiInsightRepository.count({
      where: { generated_at: MoreThan(new Date(period + '-01')) }
    });

    const riskAlerts = await this.aiInsightRepository.count({
      where: { 
        insight_type: 'risk_alert',
        generated_at: MoreThan(new Date(period + '-01'))
      }
    });

    const intelligenceReports = await this.aiInsightRepository.count({
      where: { 
        insight_type: 'intelligence_report',
        generated_at: MoreThan(new Date(period + '-01'))
      }
    });

    return {
      total_insights_this_month: insights,
      risk_alerts_this_month: riskAlerts,
      companies_with_alerts: 0, 
      most_used_feature: 'İstihbarat Raporu',
      intelligence_reports_generated: intelligenceReports
    };
  }

  private async getSectorComparison(period: string) {
    return this.dataSource.query(`
      SELECT 
        c.industry,
        i.label_tr as label_tr,
        COUNT(DISTINCT c.id) as company_count,
        AVG(ws.score) as avg_score
      FROM companies c
      LEFT JOIN industries i ON i.slug = c.industry
      LEFT JOIN wellbeing_scores ws ON ws.company_id = c.id AND ws.period = $1 AND ws.dimension = 'overall' AND ws.segment_type IS NULL
      WHERE c.is_active = true
      GROUP BY c.industry, i.label_tr
    `, [period]);
  }

  private async getAlerts(period: string) {
    return this.dataSource.query(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        ai.metadata->>'dimension' as dimension,
        (ai.metadata->>'score')::numeric as score,
        (ai.metadata->>'delta')::numeric as delta,
        ai.period
      FROM ai_insights ai
      JOIN companies c ON c.id = ai.company_id
      WHERE ai.insight_type = 'risk_alert' AND ai.period = $1
      ORDER BY ai.generated_at DESC
      LIMIT 10
    `, [period]);
  }

  private async getRecentAudit() {
    const logs = await this.auditRepository.find({
      relations: ['user', 'user.company'],
      order: { created_at: 'DESC' },
      take: 10
    });

    return logs.map(l => ({
      action: l.action,
      company_id: l.company_id,
      user_email: l.user?.email,
      company_name: l.user?.company?.name,
      created_at: l.created_at,
      ip_address: l.ip_address
    }));
  }

  async getAdminCompanyStats(companyId: string, period?: string) {
    const targetPeriod = period || new Date().toISOString().slice(0, 7);
    const trend = await this.scoreService.getTrend(companyId, 12);
    const depts = await this.scoreService.getDepartmentScores(companyId, targetPeriod);
    
    return {
      company_id: companyId,
      period: targetPeriod,
      trend_12m: trend,
      departments: depts,
    };
  }
}
