import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, In, LessThanOrEqual } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WellbeingScore } from './entities/wellbeing-score.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { ResponseAnswerSelection } from '../response/entities/response-answer-selection.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';

@Injectable()
export class ScoreService {
  private readonly logger = new Logger(ScoreService.name);

  constructor(
    @InjectRepository(WellbeingScore)
    private readonly scoreRepository: Repository<WellbeingScore>,
    private readonly dataSource: DataSource,
    @InjectQueue('score-queue') private scoreQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async recalculateScores() {
    this.logger.log('Starting scheduled score recalculation batch...');
    
    try {
      const targets = await this.dataSource.query(
        `SELECT company_id, survey_id, period FROM survey_responses 
         WHERE submitted_at >= NOW() - INTERVAL '24 hours'
         GROUP BY company_id, survey_id, period`
      );

      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const chunkSize = 10;

      for (let i = 0; i < targets.length; i += chunkSize) {
        const chunk = targets.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (t) => {
          await this.scoreQueue.add('recalculate_scores', {
            companyId: t.company_id,
            surveyId: t.survey_id,
            period: t.period
          });
          
          this.eventEmitter.emit('score.calculated', { 
            companyId: t.company_id, 
            period: t.period 
          });
        }));

        if (i + chunkSize < targets.length) {
          await sleep(100);
        }
      }
      
      return { success: true, processed: targets.length };
    } catch (e) {
      this.logger.error('Error in recalculateScores batch', e);
      throw e;
    }
  }

  async calculateAndStore(companyId: string, surveyId: string, period: string) {
    this.logger.log(`Calculating scores for company: ${companyId}, survey: ${surveyId}, period: ${period}`);

    const alertThreshold = 40; // This should ideally come from platform settings
    const resultsToUpsert: Partial<WellbeingScore>[] = [];

    // 1. Calculate General Company Scores by Dimension
    const generalScores = await this.dataSource.createQueryBuilder()
      .select('a.dimension', 'dimension')
      .addSelect('AVG(a.score)', 'avg_score')
      .addSelect('COUNT(a.id)', 'response_count')
      .from(ResponseAnswer, 'a')
      .innerJoin(SurveyResponse, 'sr', 'sr.id = a.response_id')
      .where('sr.survey_id = :surveyId', { surveyId })
      .andWhere('sr.company_id = :companyId', { companyId })
      .andWhere('a.score IS NOT NULL')
      .groupBy('a.dimension')
      .getRawMany();

    for (const gs of generalScores) {
      if (!gs.dimension) continue;
      const scoreValue = parseFloat(gs.avg_score);
      resultsToUpsert.push({
        company_id: companyId,
        period,
        segment_type: null,
        segment_value: null,
        dimension: gs.dimension,
        score: Math.round(scoreValue * 100) / 100,
        response_count: parseInt(gs.response_count),
      });

      if (scoreValue < alertThreshold) {
        await this.scoreQueue.add('risk_alert', {
          company_id: companyId,
          survey_id: surveyId,
          period,
          dimension: gs.dimension,
          score: scoreValue,
          type: 'overall'
        });
      }
    }

    // 1.5 Calculate 'Overall' dimension (average of all scores across all dimensions)
    const overallScoreRes = await this.dataSource.createQueryBuilder()
      .select('AVG(a.score)', 'avg_score')
      .addSelect('COUNT(a.id)', 'response_count')
      .from(ResponseAnswer, 'a')
      .innerJoin(SurveyResponse, 'sr', 'sr.id = a.response_id')
      .where('sr.survey_id = :surveyId', { surveyId })
      .andWhere('sr.company_id = :companyId', { companyId })
      .andWhere('a.score IS NOT NULL')
      .getRawOne();

    if (overallScoreRes && overallScoreRes.avg_score) {
      resultsToUpsert.push({
        company_id: companyId,
        period,
        segment_type: null,
        segment_value: null,
        dimension: 'overall',
        score: Math.round(parseFloat(overallScoreRes.avg_score) * 100) / 100,
        response_count: parseInt(overallScoreRes.response_count),
      });
    }

    // 2. Calculate Department Scores
    const deptScores = await this.dataSource.createQueryBuilder()
      .select('sr.department_id', 'department_id')
      .addSelect('a.dimension', 'dimension')
      .addSelect('AVG(a.score)', 'avg_score')
      .addSelect('COUNT(a.id)', 'response_count')
      .from(ResponseAnswer, 'a')
      .innerJoin(SurveyResponse, 'sr', 'sr.id = a.response_id')
      .where('sr.survey_id = :surveyId', { surveyId })
      .andWhere('sr.company_id = :companyId', { companyId })
      .andWhere('a.score IS NOT NULL')
      .andWhere('sr.department_id IS NOT NULL')
      .groupBy('sr.department_id')
      .addGroupBy('a.dimension')
      .getRawMany();

    for (const ds of deptScores) {
      if (!ds.dimension) continue;
      const scoreValue = parseFloat(ds.avg_score);
      resultsToUpsert.push({
        company_id: companyId,
        period,
        segment_type: 'department',
        segment_value: ds.department_id,
        dimension: ds.dimension,
        score: Math.round(scoreValue * 100) / 100,
        response_count: parseInt(ds.response_count),
      });

      if (scoreValue < alertThreshold) {
        await this.scoreQueue.add('risk_alert', {
          company_id: companyId,
          department_id: ds.department_id,
          period,
          dimension: ds.dimension,
          score: scoreValue,
          type: 'department'
        });
      }
    }

    // Upsert all calculated scores
    if (resultsToUpsert.length > 0) {
      await this.scoreRepository.createQueryBuilder()
        .insert()
        .into(WellbeingScore)
        .values(resultsToUpsert)
        .orUpdate(
          ['score', 'response_count', 'calculated_at'],
          ['company_id', 'period', 'segment_type', 'segment_value', 'dimension']
        )
        .execute();
    }

    this.logger.log(`Upserted ${resultsToUpsert.length} score records.`);
    return { success: true, processed_records: resultsToUpsert.length };
  }

  async getQuestionDistribution(questionId: string, companyId: string, surveyId: string) {
    const question = await this.dataSource.getRepository(SurveyQuestion).findOne({
      where: { id: questionId },
      relations: ['options', 'rows']
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const qType = question.question_type;

    // Base query to get answers for this question in this company/survey
    const baseQuery = this.dataSource.createQueryBuilder()
      .from(ResponseAnswer, 'a')
      .innerJoin(SurveyResponse, 'sr', 'sr.id = a.response_id')
      .where('a.question_id = :questionId', { questionId })
      .andWhere('sr.company_id = :companyId', { companyId })
      .andWhere('sr.survey_id = :surveyId', { surveyId });
    // Get company anonymity threshold
    const company = await this.dataSource.query(`SELECT settings FROM companies WHERE id = $1`, [companyId]);
    const threshold = company[0]?.settings?.anonymity_threshold || 5;

    // Check total response count for this question
    const totalRes = await baseQuery.clone().select('COUNT(DISTINCT a.response_id)', 'count').getRawOne();
    const totalCount = parseInt(totalRes.count) || 0;

    if (totalCount < threshold) {
      return { 
        insufficient_data: true, 
        message: 'Anonimlik eşiği nedeniyle veriler gösterilemiyor.',
        threshold,
        count: totalCount 
      };
    }

    if (qType === 'likert5' || qType === 'star_rating' || qType === 'likert10' || qType === 'nps') {
      const dist = await baseQuery.clone()
        .select('a.answer_value', 'value')
        .addSelect('COUNT(*)', 'count')
        .groupBy('a.answer_value')
        .getRawMany();
      return dist.map(d => ({ value: parseInt(d.value), count: parseInt(d.count) }));
    }

    if (qType === 'yes_no') {
      const dist = await baseQuery.clone()
        .select('a.answer_value', 'value')
        .addSelect('COUNT(*)', 'count')
        .groupBy('a.answer_value')
        .getRawMany();
      
      const yesCount = parseInt(dist.find(d => parseInt(d.value) === 1)?.count || '0');
      const noCount = parseInt(dist.find(d => parseInt(d.value) === 0)?.count || '0');
      const total = yesCount + noCount;
      return {
        yes: yesCount,
        no: noCount,
        yes_pct: total > 0 ? Math.round((yesCount / total) * 100) : 0
      };
    }

    if (qType === 'number_input') {
      const stats = await baseQuery.clone()
        .select('AVG(a.answer_number)', 'avg')
        .addSelect('MIN(a.answer_number)', 'min')
        .addSelect('MAX(a.answer_number)', 'max')
        .addSelect('STDDEV(a.answer_number)', 'stddev')
        .getRawOne();
      return {
        avg: parseFloat(stats.avg) || 0,
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        stddev: parseFloat(stats.stddev) || 0,
      };
    }

    if (qType === 'single_choice') {
      const dist = await baseQuery.clone()
        .select('a.answer_option_id', 'option_id')
        .addSelect('COUNT(*)', 'count')
        .groupBy('a.answer_option_id')
        .getRawMany();
      
      const total = dist.reduce((acc, curr) => acc + parseInt(curr.count), 0);
      
      return question.options.map(opt => {
        const found = dist.find(d => d.option_id === opt.id);
        const count = found ? parseInt(found.count) : 0;
        return {
          option_id: opt.id,
          label_tr: opt.label_tr,
          label_en: opt.label_en,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
      });
    }

    if (qType === 'multi_choice') {
      const selQuery = this.dataSource.createQueryBuilder()
        .select('ras.option_id', 'option_id')
        .addSelect('COUNT(*)', 'count')
        .from(ResponseAnswerSelection, 'ras')
        .innerJoin(SurveyResponse, 'sr', 'sr.id = ras.response_id')
        .where('ras.question_id = :questionId', { questionId })
        .andWhere('sr.company_id = :companyId', { companyId })
        .andWhere('sr.survey_id = :surveyId', { surveyId })
        .groupBy('ras.option_id');
      
      const dist = await selQuery.getRawMany();
      // Total responses is the total number of survey_responses that answered this question
      const totalRes = await baseQuery.clone().select('COUNT(DISTINCT a.response_id)', 'count').getRawOne();
      const total = parseInt(totalRes.count) || 0;

      return question.options.map(opt => {
        const found = dist.find(d => d.option_id === opt.id);
        const count = found ? parseInt(found.count) : 0;
        return {
          option_id: opt.id,
          label_tr: opt.label_tr,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
      });
    }

    if (qType === 'ranking') {
      const selQuery = this.dataSource.createQueryBuilder()
        .select('ras.option_id', 'option_id')
        .addSelect('AVG(ras.rank_order)', 'avg_rank')
        .from(ResponseAnswerSelection, 'ras')
        .innerJoin(SurveyResponse, 'sr', 'sr.id = ras.response_id')
        .where('ras.question_id = :questionId', { questionId })
        .andWhere('sr.company_id = :companyId', { companyId })
        .andWhere('sr.survey_id = :surveyId', { surveyId })
        .groupBy('ras.option_id');
      
      const dist = await selQuery.getRawMany();
      return question.options.map(opt => {
        const found = dist.find(d => d.option_id === opt.id);
        return {
          option_id: opt.id,
          label_tr: opt.label_tr,
          avg_rank: found ? parseFloat(found.avg_rank) : null
        };
      }).sort((a, b) => (a.avg_rank || 999) - (b.avg_rank || 999));
    }

    if (qType === 'open_text') {
      const texts = await baseQuery.clone()
        .select('a.answer_text', 'text')
        .andWhere('a.answer_text IS NOT NULL')
        .limit(50)
        .getRawMany();
      
      // Shuffle array securely for anonymity
      const shuffled = texts.map(t => t.text).sort(() => 0.5 - Math.random());
      return { responses: shuffled };
    }

    if (qType === 'matrix') {
      const dist = await baseQuery.clone()
        .select('a.answer_row_id', 'row_id')
        .addSelect('a.answer_value', 'value')
        .addSelect('COUNT(*)', 'count')
        .groupBy('a.answer_row_id')
        .addGroupBy('a.answer_value')
        .getRawMany();
      
      return question.rows.map(row => {
        const rowData = dist.filter(d => d.row_id === row.id);
        const distribution: Record<number, number> = {};
        for (let i = 1; i <= 5; i++) {
          const v = rowData.find(d => parseInt(d.value) === i);
          distribution[i] = v ? parseInt(v.count) : 0;
        }
        return {
          row_id: row.id,
          label_tr: row.label_tr,
          distribution
        };
      });
    }

    return null;
  }

  async getCompanyScore(companyId: string, period: string) {
    const scores = await this.scoreRepository.find({
      where: { company_id: companyId, period, segment_type: IsNull() }
    });

    const result: any = { respondent_count: 0 };
    scores.forEach(s => {
      result[s.dimension] = parseFloat(s.score as any);
      if (s.dimension === 'overall') result.respondent_count = s.response_count;
    });

    return result;
  }

  async getDepartmentScores(companyId: string, period: string) {
    const scores = await this.scoreRepository.find({
      where: { company_id: companyId, period, segment_type: 'department' }
    });

    // Group by segment_value (department_id)
    const grouped: Record<string, any> = {};
    for (const s of scores) {
      if (!s.segment_value) continue;
      if (!grouped[s.segment_value]) {
        grouped[s.segment_value] = { department_id: s.segment_value };
      }
      grouped[s.segment_value][s.dimension] = parseFloat(s.score as any);
    }

    // Add department names and check threshold
    const company = await this.dataSource.query(`SELECT settings FROM companies WHERE id = $1`, [companyId]);
    const threshold = company[0]?.settings?.anonymity_threshold || 5;

    const depts = Object.values(grouped).map(d => {
      if (d.respondent_count < threshold) {
        // Mask scores if below threshold
        const masked: any = { 
          department_id: d.department_id, 
          insufficient_data: true,
          respondent_count: d.respondent_count
        };
        return masked;
      }
      return d;
    });

    for (const d of depts) {
      if (d.department_id) {
        const deptRes = await this.dataSource.query(`SELECT name FROM departments WHERE id = $1`, [d.department_id]);
        d.department_name = deptRes[0]?.name || 'Unknown';
      }
    }

    return depts;
  }

  async getSegmentScores(companyId: string, period: string, segmentType: string) {
    const scores = await this.scoreRepository.find({
      where: { company_id: companyId, period, segment_type: segmentType }
    });

    const grouped: Record<string, any> = {};
    for (const s of scores) {
      if (!s.segment_value) continue;
      if (!grouped[s.segment_value]) {
        grouped[s.segment_value] = { segment_value: s.segment_value };
      }
      grouped[s.segment_value][s.dimension] = parseFloat(s.score as any);
    }

    return Object.values(grouped);
  }

  async getTrend(companyId: string, months: number = 6, departmentId?: string) {
    const where: any = { company_id: companyId, dimension: 'overall' };
    if (departmentId) {
      where.segment_type = 'department';
      where.segment_value = departmentId;
    } else {
      where.segment_type = IsNull();
    }

    const trends = await this.scoreRepository.find({
      where,
      order: { period: 'ASC' },
      take: months
    });

    // Enlarge to include other dimensions
    const result = [];
    for (const t of trends) {
      const allDims = await this.scoreRepository.find({
        where: { company_id: companyId, period: t.period, segment_type: where.segment_type, segment_value: where.segment_value }
      });
      const periodData: any = { period: t.period };
      allDims.forEach(d => {
        periodData[d.dimension] = parseFloat(d.score as any);
      });
      result.push(periodData);
    }

    return result;
  }

  async getBenchmark(companyId: string, period: string) {
    const companyRes = await this.dataSource.query(`SELECT industry FROM companies WHERE id = $1`, [companyId]);
    const industry = companyRes[0]?.industry;

    if (!industry) return { available: false };

    const avgScores = await this.dataSource.query(`
      SELECT dimension, AVG(score) as avg_score, COUNT(DISTINCT company_id) as company_count
      FROM wellbeing_scores w
      INNER JOIN companies c ON c.id = w.company_id
      WHERE c.industry = $1 AND w.period = $2 AND w.segment_type IS NULL
      GROUP BY dimension
    `, [industry, period]);

    if (avgScores.length === 0 || parseInt(avgScores[0].company_count) < 3) {
      return { available: false };
    }

    const result: any = { available: true };
    avgScores.forEach(s => {
      result[s.dimension] = parseFloat(s.avg_score);
    });

    return result;
  }

  async getPersonalScore(userId: string, period: string) {
    const latestResponse = await this.dataSource.getRepository(SurveyResponse).findOne({
      where: { user_id: userId },
      order: { submitted_at: 'DESC' }
    });

    if (!latestResponse) return null;

    const scores = await this.dataSource.createQueryBuilder()
      .select('a.dimension', 'dimension')
      .addSelect('AVG(a.score)', 'avg_score')
      .from(ResponseAnswer, 'a')
      .where('a.response_id = :responseId', { responseId: latestResponse.id })
      .andWhere('a.score IS NOT NULL')
      .groupBy('a.dimension')
      .getRawMany();

    const result: any = { overall: 0 };
    let totalScore = 0;
    let count = 0;

    scores.forEach(s => {
      const val = parseFloat(s.avg_score);
      result[s.dimension] = Math.round(val * 100) / 100;
      totalScore += val;
      count++;
    });

    if (count > 0) {
      result.overall = Math.round((totalScore / count) * 100) / 100;
    }

    return result;
  }
}
