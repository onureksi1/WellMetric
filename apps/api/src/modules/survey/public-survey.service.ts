import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { CampaignService } from '../campaign/campaign.service';

@Injectable()
export class PublicSurveyService {
  constructor(
    @InjectRepository(SurveyToken)
    private readonly tokenRepo: Repository<SurveyToken>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepo: Repository<SurveyResponse>,
    @InjectRepository(ResponseAnswer)
    private readonly answerRepo: Repository<ResponseAnswer>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    private readonly campaignService: CampaignService,
  ) {}

  async getByToken(token: string) {
    const surveyToken = await this.tokenRepo.findOne({
      where: { token },
      relations: ['survey', 'survey.questions', 'survey.questions.options'],
    });

    if (!surveyToken) throw new NotFoundException('Anket bulunamadı');

    return {
      is_used: surveyToken.is_used,
      expires_at: surveyToken.expires_at,
      employee: {
        full_name: surveyToken.full_name,
      },
      survey: {
        id: surveyToken.survey.id,
        title_tr: surveyToken.survey.title_tr,
        description: surveyToken.survey.description_tr,
        questions: surveyToken.survey.questions
          .sort((a, b) => a.order_index - b.order_index)
          .map(q => ({
            id: q.id,
            question_text_tr: q.question_text_tr,
            question_type: q.question_type,
            is_required: q.is_required,
            options: q.options,
          })),
      },
    };
  }

  async submit(token: string, answers: any[], ip: string) {
    const surveyToken = await this.tokenRepo.findOne({ 
      where: { token },
      relations: ['survey']
    });

    if (!surveyToken) throw new NotFoundException('Geçersiz token');
    if (surveyToken.is_used) throw new BadRequestException('Bu anket zaten dolduruldu');
    if (surveyToken.expires_at && surveyToken.expires_at < new Date()) {
      throw new BadRequestException('Anket süresi doldu');
    }

    // 1. Create main response
    const response = await this.responseRepo.save({
      survey_id: surveyToken.survey_id,
      company_id: surveyToken.company_id,
      employee_id: surveyToken.employee_id,
      period: new Date().toISOString().slice(0, 7),
      submitted_at: new Date(),
      metadata: { ip, token_id: surveyToken.id },
    });

    // 2. Save each answer
    for (const answer of answers) {
      const question = await this.questionRepo.findOne({ where: { id: answer.question_id } });
      
      let score: number | null = null;
      if (question && question.dimension && typeof answer.answer_value === 'number') {
        // Calculate score out of 100 (assuming 1-5 Likert scale)
        if (question.question_type === 'likert5') {
           score = (answer.answer_value / 5) * 100;
        } else {
           score = answer.answer_value * 20; // Fallback for other numeric
        }
      }

      await this.answerRepo.save({
        response_id: response.id,
        question_id: answer.question_id,
        answer_value: answer.answer_value,
        answer_text: answer.answer_text,
        dimension: question?.dimension || null,
        score: score,
      });
    }

    // 3. Mark token as used
    await this.tokenRepo.update(surveyToken.id, {
      is_used: true,
      metadata: { ...surveyToken.metadata, used_at: new Date(), used_ip: ip }
    });

    // 4. Update Campaign Log completion (if part of a campaign)
    try {
      await this.campaignService.markCompleted(surveyToken.id);
    } catch (err) {
      console.error('[PublicSurveyService.submit] Failed to mark campaign completed', err);
    }

    return { submitted: true };
  }
}
