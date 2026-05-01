import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { SurveyResponse } from './entities/survey-response.entity';
import { ResponseAnswer } from './entities/response-answer.entity';
import { ResponseAnswerSelection } from './entities/response-answer-selection.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';

import { SubmitResponseDto, AnswerItemDto } from './dto/submit-response.dto';
import { calculateScore, calculateTenureMonths } from './helpers/score-calculator';
import { DistributionLog } from '../campaign/entities/distribution-log.entity';
import { DistributionCampaign } from '../campaign/entities/distribution-campaign.entity';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    private readonly dataSource: DataSource,
  ) {}

  private validateAnswer(question: SurveyQuestion, item: AnswerItemDto) {
    if (question.is_required) {
      const qType = question.question_type;
      if (['likert5', 'likert10', 'star_rating', 'yes_no', 'nps'].includes(qType)) {
        if (item.answer_value === undefined || item.answer_value === null) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_value` });
      } else if (qType === 'number_input') {
        if (item.answer_number === undefined || item.answer_number === null) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_number` });
      } else if (qType === 'open_text') {
        if (!item.answer_text || item.answer_text.trim() === '') throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_text` });
      } else if (qType === 'single_choice') {
        if (!item.answer_option_id) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_option_id` });
      } else if (qType === 'multi_choice') {
        if (!item.answer_option_ids || item.answer_option_ids.length === 0) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_option_ids` });
      } else if (qType === 'ranking') {
        if (!item.answer_ranking || item.answer_ranking.length === 0) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_ranking` });
        if (item.answer_ranking.length !== question.options?.length) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires ranking for all options` });
      } else if (qType === 'matrix') {
        if (!item.answer_matrix || item.answer_matrix.length === 0) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answer_matrix` });
        if (item.answer_matrix.length !== question.rows?.length) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${question.id} requires answers for all matrix rows` });
      }
    }

    // Range checks
    if (item.answer_value !== undefined && item.answer_value !== null) {
       if (question.question_type === 'likert5' && (item.answer_value < 1 || item.answer_value > 5)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid likert5 value' });
       if (question.question_type === 'likert10' && (item.answer_value < 1 || item.answer_value > 10)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid likert10 value' });
       if (question.question_type === 'star_rating' && (item.answer_value < 1 || item.answer_value > 5)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid star_rating value' });
       if (question.question_type === 'yes_no' && ![0,1].includes(item.answer_value)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid yes_no value' });
       if (question.question_type === 'nps' && (item.answer_value < 0 || item.answer_value > 10)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid nps value' });
    }
  }

  async submitTokenMode(tokenStr: string, dto: SubmitResponseDto) {
    return this.dataSource.transaction(async manager => {
      // 1. Validate Token
      const token = await manager.createQueryBuilder(SurveyToken, 'st')
        .leftJoinAndSelect('st.survey', 's')
        .leftJoinAndSelect('s.questions', 'q')
        .leftJoinAndSelect('q.options', 'qo')
        .leftJoinAndSelect('q.rows', 'qr')
        .where('st.token = :token', { token: tokenStr })
        .getOne();

      if (!token) throw new NotFoundException({ code: 'SURVEY_TOKEN_INVALID', message: 'Geçersiz token.' });
      if (token.is_used) throw new BadRequestException({ code: 'SURVEY_TOKEN_USED', message: 'Bu token daha önce kullanılmış.' });
      if (token.expires_at && token.expires_at < new Date()) throw new BadRequestException({ code: 'SURVEY_TOKEN_EXPIRED', message: 'Bu token süresi dolmuş.' });

      // 2. Create Response Record
      const response = manager.create(SurveyResponse, {
        survey_id: token.survey_id,
        company_id: token.company_id,
        department_id: token.department_id,
        is_anonymous: token.survey.is_anonymous,
      });

      const savedResponse = await manager.save(response);

      // 3. Process each answer
      for (const item of dto.answers) {
        const question = token.survey.questions.find(q => q.id === item.question_id);
        if (!question) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Question ${item.question_id} not found in survey` });

        this.validateAnswer(question, item);

        const qType = question.question_type;

        if (['likert5', 'likert10', 'star_rating', 'yes_no', 'nps', 'number_input', 'single_choice'].includes(qType)) {
          const score = calculateScore(question, item);
          const answer = manager.create(ResponseAnswer, {
            response_id: savedResponse.id,
            question_id: question.id,
            dimension: question.dimension,
            answer_value: item.answer_value,
            answer_number: item.answer_number,
            answer_option_id: item.answer_option_id,
            score
          });
          await manager.save(answer);
        } else if (qType === 'open_text') {
          const answer = manager.create(ResponseAnswer, {
            response_id: savedResponse.id,
            question_id: question.id,
            dimension: question.dimension,
            answer_text: item.answer_text,
          });
          await manager.save(answer);
        } else if (qType === 'matrix') {
          if (item.answer_matrix) {
            for (const mat of item.answer_matrix) {
              const row = question.rows.find(r => r.id === mat.row_id);
              if (!row) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Matrix row ${mat.row_id} not found` });
              
              const score = calculateScore(question, { answer_value: mat.value, answer_row_id: row.id }, row);
              const answer = manager.create(ResponseAnswer, {
                response_id: savedResponse.id,
                question_id: question.id,
                dimension: row.dimension || question.dimension,
                answer_row_id: row.id,
                answer_value: mat.value,
                score
              });
              await manager.save(answer);
            }
          }
        } else if (qType === 'multi_choice') {
          const answer = manager.create(ResponseAnswer, { response_id: savedResponse.id, question_id: question.id, dimension: question.dimension });
          await manager.save(answer);

          if (item.answer_option_ids) {
            for (const optId of item.answer_option_ids) {
              const sel = manager.create(ResponseAnswerSelection, { response_id: savedResponse.id, question_id: question.id, option_id: optId });
              await manager.save(sel);
            }
          }
        } else if (qType === 'ranking') {
          const answer = manager.create(ResponseAnswer, { response_id: savedResponse.id, question_id: question.id, dimension: question.dimension });
          await manager.save(answer);

          if (item.answer_ranking) {
            let rank = 1;
            for (const optId of item.answer_ranking) {
              const sel = manager.create(ResponseAnswerSelection, { response_id: savedResponse.id, question_id: question.id, option_id: optId, rank_order: rank++ });
              await manager.save(sel);
            }
          }
        }
      }

      // 4. Invalidate token
      token.is_used = true;
      await manager.save(token);

      // 5. Update Distribution Tracking
      const distLog = await manager.findOne(DistributionLog, {
        where: { surveyTokenId: token.id },
      });
      if (distLog && !distLog.completed_at) {
        distLog.completed_at = new Date();
        await manager.save(distLog);

        await manager.increment(DistributionCampaign, { id: distLog.campaignId }, 'completed_count', 1);
      }

      // 6. Fire BullMQ event in real-world, returning success here
      return { success: true, message: 'Yanıtlarınız başarıyla kaydedildi.' };
    });
  }

  async submitAccountMode(userId: string, surveyId: string, dto: SubmitResponseDto) {
    // Similar logic but fetched using userId and surveyId instead of token
    return { success: true };
  }

  async getPendingAccountMode(userId: string) {
    return [];
  }

  async getHistory(userId: string) {
    return [];
  }
}
