import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ScoreService } from '../score/score.service';
import { BenchmarkService } from '../benchmark/benchmark.service';
import { AiInsight } from '../ai/entities/ai-insight.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { getScoreColor } from '../../common/constants/score-colors';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DashboardService {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(forwardRef(() => ScoreService))
    private readonly scoreService: ScoreService,
    @InjectRepository(AiInsight)
    private readonly aiInsightRepository: Repository<AiInsight>,
    @InjectRepository(SurveyAssignment)
    private readonly assignmentRepository: Repository<SurveyAssignment>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    @InjectRepository(SurveyToken)
    private readonly tokenRepository: Repository<SurveyToken>,
    private readonly benchmarkService: BenchmarkService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  private getCurrentPeriod(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 2);
    return date.toISOString().slice(0, 7);
  }

  async getOverview(companyId: string, period?: string) {
    const targetPeriod = period || this.getCurrentPeriod();
    const cacheKey = `dashboard:${companyId}:${targetPeriod}`;

    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 1. SKOR KARTI
    const scoreCard = await this.scoreService.getCompanyScore(companyId, targetPeriod);

    // 2. ÖNCEKİ AY KARŞILAŞTIRMASI
    const previousPeriod = this.getPreviousPeriod(targetPeriod);
    const prevScoreCard = await this.scoreService.getCompanyScore(companyId, previousPeriod);

    const changes: any = {
      overall_change: scoreCard.overall && prevScoreCard.overall ? scoreCard.overall - prevScoreCard.overall : 0,
      dimension_changes: {},
    };

    ['physical', 'mental', 'social', 'financial', 'work'].forEach(dim => {
      changes.dimension_changes[dim] = scoreCard[dim] && prevScoreCard[dim] ? scoreCard[dim] - prevScoreCard[dim] : 0;
    });

    // 3. BENCHMARK
    const benchmarkRes = await this.benchmarkService.getBenchmarkForCompany(companyId, targetPeriod);
    const benchmarkData = {
      available: !!benchmarkRes?.benchmark?.overall?.turkey_platform?.score,
      sector_average: benchmarkRes?.benchmark?.overall?.turkey_platform?.score || null,
      difference: (benchmarkRes?.benchmark?.overall?.turkey_platform?.score && scoreCard.overall) 
        ? scoreCard.overall - benchmarkRes.benchmark.overall.turkey_platform.score 
        : null,
    };

    // 4. KATILIM ORANI (Tüm davetler ve yanıtlar üzerinden)
    const totalInvited = await this.tokenRepository.count({
      where: { company_id: companyId }
    });

    const totalResponded = await this.responseRepository.count({
      where: { company_id: companyId, period: targetPeriod }
    });

    const participationRate = totalInvited > 0 ? (totalResponded / totalInvited) * 100 : 0;

    // 5. RİSK ALARMLARI
    const riskAlerts: { dimension: string; score: number; change: number }[] = [];
    ['physical', 'mental', 'social', 'financial', 'work'].forEach(dim => {
      if (scoreCard[dim] && scoreCard[dim] < 50) {
        riskAlerts.push({
          dimension: dim,
          score: scoreCard[dim],
          change: changes.dimension_changes[dim],
        });
      }
    });

    // 6. AI INSIGHT KARTI
    const aiInsight = await this.aiInsightRepository.findOne({
      where: {
        company_id: companyId,
        insight_type: In(['open_text_summary', 'trend_analysis']),
      },
      order: { generated_at: 'DESC' },
    });

    // 7. TREND GRAFİK
    const trend = await this.scoreService.getTrend(companyId, 6);

    const dashboardData = {
      period: targetPeriod,
      score_card: {
        overall: scoreCard.overall,
        dimensions: {
          physical: scoreCard.physical ?? null,
          mental: scoreCard.mental ?? null,
          social: scoreCard.social ?? null,
          financial: scoreCard.financial ?? null,
          work: scoreCard.work ?? null,
        },
        respondent_count: scoreCard.respondent_count || 0,
      },
      changes,
      benchmark: benchmarkData,
      participation_rate: participationRate,
      risk_alerts: riskAlerts,
      ai_insight: aiInsight ? { content: aiInsight.content, generated_at: aiInsight.generated_at } : null,
      trend,
      company_name: (await this.dataSource.query(`SELECT name FROM companies WHERE id = $1`, [companyId]))[0]?.name || 'Şirketiniz',
    };

    await this.redisClient.set(cacheKey, JSON.stringify(dashboardData), 'EX', 1800);
    return dashboardData;
  }

  async getDimensions(companyId: string, period?: string) {
    const targetPeriod = period || this.getCurrentPeriod();
    const cacheKey = `dashboard:dims:${companyId}:${targetPeriod}`;

    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const scoreCard = await this.scoreService.getCompanyScore(companyId, targetPeriod);
    const prevPeriod = this.getPreviousPeriod(targetPeriod);
    const prevScoreCard = await this.scoreService.getCompanyScore(companyId, prevPeriod);
    
    const deptScores = await this.scoreService.getDepartmentScores(companyId, targetPeriod);

    const dimensions = ['physical', 'mental', 'social', 'financial', 'work'].map(dim => {
      const currentScore = scoreCard[dim];
      const previousScore = prevScoreCard[dim];
      
      // Trend (last 3 months)
      // En yüksek ve en düşük departman
      const sortedDepts = [...deptScores].filter(d => d[dim] !== null).sort((a, b) => b[dim] - a[dim]);

      return {
        dimension: dim,
        score: currentScore ?? null,
        change: currentScore && previousScore ? currentScore - previousScore : 0,
        top_department: sortedDepts[0]?.department_name || null,
        bottom_department: sortedDepts[sortedDepts.length - 1]?.department_name || null,
      };
    });

    await this.redisClient.set(cacheKey, JSON.stringify(dimensions), 'EX', 1800);
    return dimensions;
  }

  async getDepartments(companyId: string, period?: string) {
    const targetPeriod = period || this.getCurrentPeriod();
    const cacheKey = `dashboard:depts:${companyId}:${targetPeriod}`;

    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const deptScores = await this.scoreService.getDepartmentScores(companyId, targetPeriod);
    const prevPeriod = this.getPreviousPeriod(targetPeriod);
    const prevDeptScores = await this.scoreService.getDepartmentScores(companyId, prevPeriod);

    const enrichedDepts = deptScores.map(dept => {
      const prevDept = prevDeptScores.find(d => d.department_id === dept.department_id);
      return {
        ...dept,
        change: dept.overall && prevDept?.overall ? dept.overall - prevDept.overall : 0,
        color_code: getScoreColor(dept.overall),
      };
    }).sort((a, b) => (a.overall || 0) - (b.overall || 0));

    await this.redisClient.set(cacheKey, JSON.stringify(enrichedDepts), 'EX', 1800);
    return enrichedDepts;
  }

  async getSegments(companyId: string, period: string, segmentType: string) {
    const cacheKey = `dashboard:seg:${companyId}:${segmentType}:${period}`;

    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const segmentScores = await this.scoreService.getSegmentScores(companyId, period, segmentType);

    const enrichedSegments = segmentScores.map(seg => ({
      ...seg,
      color_code: getScoreColor(seg.overall),
    }));

    await this.redisClient.set(cacheKey, JSON.stringify(enrichedSegments), 'EX', 1800);
    return enrichedSegments;
  }

  async getTrends(companyId: string, months: number = 12, departmentId?: string) {
    return this.scoreService.getTrend(companyId, months, departmentId);
  }

  async getBenchmark(companyId: string, period?: string) {
    const targetPeriod = period || this.getCurrentPeriod();
    return this.benchmarkService.getBenchmarkForCompany(companyId, targetPeriod);
  }

  async invalidateCache(companyId: string, period: string) {
    const keys = [
      `dashboard:${companyId}:${period}`,
      `dashboard:dims:${companyId}:${period}`,
      `dashboard:depts:${companyId}:${period}`,
      `dashboard:seg:${companyId}:*:${period}`,
    ];
    
    for (const key of keys) {
      if (key.includes('*')) {
        const matchingKeys = await this.redisClient.keys(key);
        if (matchingKeys.length > 0) {
          await this.redisClient.del(...matchingKeys);
        }
      } else {
        await this.redisClient.del(key);
      }
    }
  }

  @OnEvent('score.calculated')
  async handleScoreCalculated(payload: { companyId: string; period: string }) {
    this.logger.log(`Received score.calculated event for company: ${payload.companyId}, period: ${payload.period}`);
    await this.invalidateCache(payload.companyId, payload.period);
  }
}
