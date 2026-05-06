import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndustryBenchmarkScore } from './benchmark.entity';
import { WellbeingScore } from '../score/entities/wellbeing-score.entity';
import { Company } from '../company/entities/company.entity';
import { AIService } from '../ai/ai.service';

@Injectable()
export class BenchmarkService {
  constructor(
    @InjectRepository(IndustryBenchmarkScore)
    private readonly benchmarkRepo: Repository<IndustryBenchmarkScore>,
    @InjectRepository(WellbeingScore)
    private readonly scoreRepo: Repository<WellbeingScore>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly aiService: AIService,
  ) {}

  // HR Dashboard ana endpoint'i için
  async getBenchmarkForCompany(companyId: string, period: string) {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) return null;
    
    const industry = company.industry;
    const dimensions = ['overall','physical','mental','social','financial','work'];
    const result: Record<string, any> = {};

    for (const dim of dimensions) {
      // 1. Seed / admin benchmark'ları çek (global + turkey)
      const [globalBench, turkeyBench] = await Promise.all([
        this.benchmarkRepo.findOne({
          where: { industry, region: 'global', dimension: dim }
        }),
        this.benchmarkRepo.findOne({
          where: { industry, region: 'turkey', dimension: dim }
        }),
      ]);

      // 2. Platformun kendi gerçek verisini kontrol et
      // Min 3 firma + 30 yanıt şartı
      const realData = await this.getRealBenchmark(industry, dim, period);
      const hasRealData = realData && Number(realData.firm_count) >= 3 && Number(realData.resp_count) >= 30;

      // 3. Skor Belirleme (Harmanlanmış veya Saf Veri)
      let turkeyScore = turkeyBench ? Number(turkeyBench.score) : null;
      let turkeyDataSource = 'research';

      if (hasRealData && turkeyScore !== null) {
        // Harmanlanmış veri: (Araştırma + Platform Gerçek Verisi) / 2
        turkeyScore = (turkeyScore + Number(realData.avg_score)) / 2;
        turkeyDataSource = 'blended';
      } else if (hasRealData) {
        turkeyScore = Number(realData.avg_score);
        turkeyDataSource = 'platform';
      }

      result[dim] = {
        turkey_platform: turkeyScore !== null ? { 
          score: Math.round(turkeyScore * 10) / 10, 
          source: hasRealData ? 'Platform & Research Blend' : (turkeyBench?.source || 'Research'), 
          data_source: turkeyDataSource,
          is_seed: !hasRealData && (turkeyBench?.isSeed ?? true)
        } : null,

        global: globalBench ? { 
          score: Number(globalBench.score), 
          source: globalBench.source,
          source_year: globalBench.sourceYear, 
          data_source: 'research',
          is_seed: globalBench.isSeed 
        } : null,

        platform_progress: {
          firm_count: realData ? Number(realData.firm_count) : 0,
          resp_count: realData ? Number(realData.resp_count) : 0,
          threshold_firms: 3,
          threshold_responses: 30,
          is_active: hasRealData,
        },
      };
    }

    return { industry, period, benchmark: result };
  }

  private async getRealBenchmark(industry: string, dimension: string, period: string) {
    const result = await this.scoreRepo
      .createQueryBuilder('ws')
      .innerJoin(Company, 'c', 'c.id = ws.company_id')
      .select('COUNT(DISTINCT ws.company_id)', 'firm_count')
      .addSelect('SUM(ws.response_count)', 'resp_count')
      .addSelect('AVG(ws.score)', 'avg_score')
      .where('c.industry = :industry', { industry })
      .andWhere('ws.dimension = :dim', { dim: dimension })
      .andWhere('ws.period = :period', { period })
      .andWhere('ws.segment_type IS NULL')
      .andWhere('ws.segment_value IS NULL')
      .getRawOne();

    return result;
  }

  // Admin: seed üzerine yaz
  async updateBenchmark(
    industry: string, region: string, dimension: string,
    score: number, source: string, adminId: string,
  ) {
    await this.benchmarkRepo.upsert({
      industry, region, dimension,
      score, source,
      isSeed: false,            // artık seed değil, admin güncelledi
      updatedBy: adminId,
      updatedAt: new Date(),
    }, ['industry', 'region', 'dimension']);
  }

  // Admin: tüm benchmark'ları listele (sektör filtreli)
  async findAll(industry?: string) {
    const where = industry ? { industry } : {};
    return this.benchmarkRepo.find({ where, order: { industry: 'ASC', region: 'ASC', dimension: 'ASC' } });
  }

  // Admin: seed'e sıfırla
  async resetBenchmark(id: string) {
    const benchmark = await this.benchmarkRepo.findOne({ where: { id } });
    if (!benchmark) return;

    await this.benchmarkRepo.update(id, {
      isSeed: true,
      updatedBy: null,
      updatedAt: new Date(),
    });
  }

  async aiGenerateBenchmarks(industry: string, region: string) {
    const dimensions = ['overall','physical','mental','social','financial','work'];
    const suggestions = await this.aiService.generateBenchmarkSuggestions(industry, region, dimensions);
    return suggestions.suggestions;
  }
}
