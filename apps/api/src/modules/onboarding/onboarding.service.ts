import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingAssignment } from './entities/onboarding-assignment.entity';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';
import { ResponseAnswer } from '../response/entities/response-answer.entity';
import { SettingsService } from '../settings/settings.service';
import { SurveyTokenService } from '../survey-token/survey-token.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingAssignment)
    private readonly assignmentRepo: Repository<OnboardingAssignment>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(ResponseAnswer)
    private readonly answerRepo: Repository<ResponseAnswer>,
    private readonly settingsService: SettingsService,
    private readonly tokenService: SurveyTokenService,
    private readonly logger: AppLogger,
  ) {}

  async getAnonymityThreshold(companyId: string): Promise<number> {
    const settings = await this.settingsService.getSettings();
    return settings?.anonymity_threshold || 5;
  }

  async getWaveByNumber(companyId: string, waveNumber: number) {
    // Wave mappings: 1 -> wave1Id, 2 -> wave2Id, 3 -> wave3Id
    const waveIds = {
      1: '00000000-0000-0000-0000-0000000000a1',
      2: '00000000-0000-0000-0000-0000000000a2',
      3: '00000000-0000-0000-0000-0000000000a3',
    };
    const surveyId = waveIds[waveNumber];
    if (!surveyId) return null;

    return this.surveyRepo.findOne({ where: { id: surveyId } });
  }

  async getAggregateResults(companyId: string, waveNumber: number) {
    const completedCount = await this.assignmentRepo.count({
      where: { company_id: companyId, wave_number: waveNumber, status: 'completed' },
    });

    const threshold = await this.getAnonymityThreshold(companyId);
    
    if (completedCount < threshold) {
      return {
        wave_number: waveNumber,
        completed_count: completedCount,
        threshold,
        results: null,
        message: `En az ${threshold} yanıt gerekiyor. Şu an: ${completedCount}`,
      };
    }

    const wave = await this.getWaveByNumber(companyId, waveNumber);
    if (!wave) throw new NotFoundException('Wave not found');

    const questions = await this.questionRepo.find({
      where: { survey_id: wave.id },
      order: { order_index: 'ASC' },
    });

    const results = [];

    for (const question of questions) {
      if (question.question_type === 'open_text') {
        const answers = await this.answerRepo
          .createQueryBuilder('a')
          .select('a.answer_text', 'text')
          .innerJoin('surveys', 's', 's.id = :sid', { sid: wave.id })
          .innerJoin('survey_responses', 'r', 'r.id = a.response_id')
          .where('a.question_id = :qid', { qid: question.id })
          .andWhere('r.company_id = :cid', { cid: companyId })
          .andWhere('a.answer_text IS NOT NULL')
          .andWhere('a.answer_text != :empty', { empty: '' })
          .getRawMany();

        results.push({
          question_id:   question.id,
          question_text: question.question_text_tr,
          question_type: 'open_text',
          answers: answers.map(a => a.text),
        });

      } else {
        const avg = await this.answerRepo
          .createQueryBuilder('a')
          .select('AVG(a.answer_value)', 'average')
          .addSelect('COUNT(*)', 'count')
          .innerJoin('survey_responses', 'r', 'r.id = a.response_id')
          .where('a.question_id = :qid', { qid: question.id })
          .andWhere('r.company_id = :cid', { cid: companyId })
          .andWhere('a.answer_value IS NOT NULL')
          .getRawOne();

        results.push({
          question_id:   question.id,
          question_text: question.question_text_tr,
          question_type: question.question_type,
          average:       avg?.average ? Math.round(Number(avg.average) * 10) / 10 : null,
          count:         Number(avg?.count ?? 0),
        });
      }
    }

    return { 
      wave_number: waveNumber, 
      completed_count: completedCount, 
      results,
      threshold 
    };
  }

  async getEmployeeStatuses(companyId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { company_id: companyId },
      relations: ['user'],
      order: { user_id: 'ASC', wave_number: 'ASC' },
    });

    // Also get all employees of the company to show those without assignments
    const allUsers = await this.assignmentRepo.manager.query(
      `SELECT id, full_name, email, start_date FROM users WHERE company_id = $1 AND role = 'employee'`,
      [companyId]
    );

    const grouped = {};
    
    // Initialize with all users
    for (const u of allUsers) {
      grouped[u.id] = {
        user_id:    u.id,
        full_name:  u.full_name,
        email:      u.email,
        start_date: u.start_date,
        waves: [],
      };
    }

    // Add assignments
    for (const a of assignments) {
      if (grouped[a.user_id]) {
        grouped[a.user_id].waves.push({
          wave_number:  a.wave_number,
          status:       a.status,
          scheduled_at: a.scheduled_at,
          sent_at:      a.sent_at,
          completed_at: a.completed_at,
        });
      }
    }

    return Object.values(grouped);
  }

  async handleOnboardingCompletion(tokenId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: {
        survey_token_id: tokenId,
      },
    });

    if (assignment && assignment.status !== 'completed') {
      await this.assignmentRepo.update(assignment.id, {
        status: 'completed',
        completed_at: new Date(),
      });
    }
  }

  @OnEvent('survey.submitted')
  async handleSurveySubmitted(payload: { tokenId: string; surveyType: string }) {
    if (payload.surveyType === 'onboarding') {
      await this.handleOnboardingCompletion(payload.tokenId);
    }
  }

  async sendScheduledOnboarding() {
    this.logger.info('Onboarding CRON başladı', { service: 'OnboardingService' });
    const pending = await this.assignmentRepo.find({
      where: { status: 'sent' }, // Example status
      relations: ['user']
    });
    this.logger.info(`${pending.length} bekleyen onboarding bulundu`,
      { service: 'OnboardingService' });

    for (const assignment of pending) {
      const ctx = {
        service:   'OnboardingService',
        userId:    assignment.user_id,
        companyId: assignment.company_id,
        extra:     { wave: assignment.wave_number },
      };
      try {
        this.logger.debug('Onboarding token oluşturuluyor', ctx);
        // ... token oluştur logic

        this.logger.debug('Onboarding maili kuyruğa ekleniyor', ctx);
        // ... mail gönder logic

        this.logger.info('Onboarding gönderildi', ctx, {
          wave:  assignment.wave_number,
          email: assignment.user?.email,
        });
      } catch (err) {
        this.logger.error('Onboarding gönderilemedi', ctx, err);
        // Hata tek kaydı durdurmaz — devam et
      }
    }

    this.logger.info('Onboarding CRON tamamlandı', { service: 'OnboardingService' },
      { total: pending.length });
  }
}
