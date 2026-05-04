import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Survey } from './entities/survey.entity';
import { SurveyQuestion } from './entities/survey-question.entity';
import { SurveyQuestionOption } from './entities/survey-question-option.entity';
import { SurveyQuestionRow } from './entities/survey-question-row.entity';
import { SurveyAssignment } from './entities/survey-assignment.entity';
import { Company } from '../company/entities/company.entity';
import { SurveyDraft } from './entities/survey-draft.entity';
import { AIService } from '../ai/ai.service';
import { CompanyService } from '../company/company.service';
import { AiGenerateSurveyDto } from './dto/ai-generate-survey.dto';

import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { CreateQuestionDto, QuestionType } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ReorderQuestionsDto } from './dto/reorder-questions.dto';
import { SurveyFilterDto } from './dto/survey-filter.dto';
import { AssignSurveyDto } from './dto/assign-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(SurveyQuestion)
    private readonly questionRepository: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAssignment)
    private readonly assignmentRepository: Repository<SurveyAssignment>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(SurveyDraft)
    private readonly draftRepository: Repository<SurveyDraft>,
    private readonly aiService: AIService,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private readonly dataSource: DataSource,
  ) {}

  private validateQuestionRules(dto: Partial<CreateQuestionDto>) {
    const qType = dto.question_type;

    // 1. is_reversed rules
    const scorableTypes = [
      QuestionType.LIKERT5, QuestionType.LIKERT10, QuestionType.STAR_RATING,
      QuestionType.YES_NO, QuestionType.NPS, QuestionType.NUMBER_INPUT,
      QuestionType.SINGLE_CHOICE, QuestionType.MATRIX
    ];
    if (dto.is_reversed && !scorableTypes.includes(qType as QuestionType)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `is_reversed is not allowed for ${qType}` });
    }

    // 2. Options / Rows requirements
    if ([QuestionType.SINGLE_CHOICE, QuestionType.MULTI_CHOICE, QuestionType.RANKING].includes(qType as QuestionType)) {
      if (!dto.options || dto.options.length < 2) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `${qType} requires at least 2 options` });
      }
      const uniqueOrders = new Set(dto.options.map(o => o.order_index));
      if (uniqueOrders.size !== dto.options.length) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `Option order_index must be unique` });
      }
    } else if (qType === QuestionType.MATRIX) {
      if (!dto.rows || dto.rows.length < 2) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `matrix requires at least 2 rows` });
      }
    } else if (qType === QuestionType.NUMBER_INPUT) {
      if (dto.number_min === undefined || dto.number_max === undefined) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `number_input requires number_min and number_max` });
      }
      if (dto.number_max <= dto.number_min) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `number_max must be greater than number_min` });
      }
    } else {
      if (dto.options && dto.options.length > 0) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `${qType} should not have options` });
      }
      if (dto.rows && dto.rows.length > 0) {
        throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `${qType} should not have rows` });
      }
    }
  }

  async findAll(filters: SurveyFilterDto, companyId?: string, isHrAdmin = false) {
    const { type, is_active, page = 1, per_page = 50 } = filters;
    
    const query = this.surveyRepository.createQueryBuilder('s');
    
    if (isHrAdmin && companyId) {
      // HR Admin only sees surveys assigned to their company
      query.innerJoin('s.assignments', 'sa', 'sa.company_id = :companyId', { companyId });
    }

    if (type) query.andWhere('s.type = :type', { type });
    if (is_active !== undefined) query.andWhere('s.is_active = :is_active', { is_active });

    query.orderBy('s.created_at', 'DESC')
         .limit(per_page)
         .offset((page - 1) * per_page);

    const [surveys, total] = await query.getManyAndCount();

    const data = await Promise.all(surveys.map(async s => {
      const qCount = await this.questionRepository.count({ where: { survey_id: s.id } });
      const aCount = await this.assignmentRepository.count({ where: { survey_id: s.id } });
      return {
        id: s.id,
        title_tr: s.title_tr,
        title_en: s.title_en,
        type: s.type,
        frequency: s.frequency,
        is_active: s.is_active,
        question_count: qCount,
        assigned_company_count: aCount,
        last_period_participation: 0, // Placeholder for analytics
      };
    }));

    return { data, meta: { total, page, per_page, total_pages: Math.ceil(total / per_page) } };
  }

  async findOne(id: string, companyId?: string, isHrAdmin = false) {
    const query = this.surveyRepository.createQueryBuilder('s')
      .leftJoinAndSelect('s.questions', 'q')
      .leftJoinAndSelect('q.options', 'qo')
      .leftJoinAndSelect('q.rows', 'qr')
      .where('s.id = :id', { id })
      .orderBy('q.order_index', 'ASC')
      .addOrderBy('qo.order_index', 'ASC')
      .addOrderBy('qr.order_index', 'ASC');

    if (isHrAdmin && companyId) {
      // Allow access if: assigned via survey_assignments OR directly linked via company_id
      query.andWhere(
        `(s.company_id = :companyId OR EXISTS (
          SELECT 1 FROM survey_assignments sa
          WHERE sa.survey_id = s.id AND sa.company_id = :companyId
        ))`,
        { companyId }
      );
    }

    const survey = await query.getOne();
    if (!survey) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Anket bulunamadı.' });

    return survey;
  }

  async createSurvey(dto: CreateSurveyDto, createdBy: string) {
    return this.dataSource.transaction(async manager => {
      const survey = manager.create(Survey, {
        title_tr: dto.title_tr,
        title_en: dto.title_en,
        description_tr: dto.description_tr,
        description_en: dto.description_en,
        type: dto.type,
        company_id: dto.company_id,
        frequency: dto.frequency,
        is_anonymous: dto.is_anonymous,
        throttle_days: dto.throttle_days,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
        created_by: createdBy
      });

      const savedSurvey = await manager.save(survey);

      if (dto.questions && dto.questions.length > 0) {
        for (const [index, qDto] of dto.questions.entries()) {
          this.validateQuestionRules(qDto);

          const question = manager.create(SurveyQuestion, {
            survey_id: savedSurvey.id,
            dimension: qDto.dimension,
            question_text_tr: qDto.question_text_tr,
            question_text_en: qDto.question_text_en,
            question_type: qDto.question_type,
            is_reversed: qDto.is_reversed,
            weight: qDto.weight,
            is_required: qDto.is_required,
            order_index: index + 1,
            number_min: qDto.number_min,
            number_max: qDto.number_max,
            number_step: qDto.number_step,
            matrix_label_tr: qDto.matrix_label_tr,
            matrix_label_en: qDto.matrix_label_en,
          });

          const savedQuestion = await manager.save(question);

          if (qDto.options && qDto.options.length > 0) {
            const options = qDto.options.map(o => manager.create(SurveyQuestionOption, {
              question_id: savedQuestion.id,
              ...o
            }));
            await manager.save(options);
          }

          if (qDto.rows && qDto.rows.length > 0) {
            const rows = qDto.rows.map(r => manager.create(SurveyQuestionRow, {
              question_id: savedQuestion.id,
              ...r
            }));
            await manager.save(rows);
          }
        }
      }

      await manager.query(`INSERT INTO audit_logs (action, actor_id, target_id, metadata) VALUES ($1, $2, $3, $4)`, 
        ['survey.create', createdBy, savedSurvey.id, JSON.stringify(dto)]
      );

      return savedSurvey;
    });
  }
  async updateSurvey(id: string, dto: UpdateSurveyDto, actorId: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.company_id = companyId;

    const survey = await this.surveyRepository.findOne({ where });
    if (!survey) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Anket bulunamadı.' });

    // Block updates if survey is active and has started
    if (survey.is_active && survey.starts_at && new Date(survey.starts_at) <= new Date()) {
       // Only allow closing the survey (setting is_active to false)
       if (dto.is_active !== false) {
         throw new BadRequestException({ code: 'SURVEY_ACTIVE', message: 'Aktif ve başlamış bir anket üzerinde bu değişiklik yapılamaz.' });
       }
    }

    Object.assign(survey, dto);
    const updated = await this.surveyRepository.save(survey);

    await this.dataSource.query(`INSERT INTO audit_logs (action, actor_id, target_id, metadata) VALUES ($1, $2, $3, $4)`, 
      ['survey.update', actorId, id, JSON.stringify(dto)]
    );

    return updated;
  }

  async deleteSurvey(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) where.company_id = companyId;

    const survey = await this.surveyRepository.findOne({ where });
    if (!survey) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Anket bulunamadı.' });

    await this.surveyRepository.remove(survey);
    return { success: true };
  }

  async addQuestion(surveyId: string, dto: CreateQuestionDto, actorId: string) {
    return this.dataSource.transaction(async manager => {
      const survey = await manager.findOne(Survey, { where: { id: surveyId } });
      if (!survey) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Anket bulunamadı.' });

      if (survey.is_active && survey.starts_at && new Date(survey.starts_at) <= new Date()) {
        throw new BadRequestException({ code: 'SURVEY_ACTIVE', message: 'Aktif ankete yeni soru eklenemez.' });
      }

      this.validateQuestionRules(dto);

      const maxOrderRes = await manager.query(`SELECT MAX(order_index) as max FROM survey_questions WHERE survey_id = $1`, [surveyId]);
      const nextOrder = (parseInt(maxOrderRes[0].max) || 0) + 1;

      const question = manager.create(SurveyQuestion, {
        survey_id: surveyId,
        dimension: dto.dimension,
        question_text_tr: dto.question_text_tr,
        question_text_en: dto.question_text_en,
        question_type: dto.question_type,
        is_reversed: dto.is_reversed,
        weight: dto.weight,
        is_required: dto.is_required,
        order_index: nextOrder,
        number_min: dto.number_min,
        number_max: dto.number_max,
        number_step: dto.number_step,
        matrix_label_tr: dto.matrix_label_tr,
        matrix_label_en: dto.matrix_label_en,
      });

      const saved = await manager.save(question);

      if (dto.options) {
        const options = dto.options.map(o => manager.create(SurveyQuestionOption, { question_id: saved.id, ...o }));
        await manager.save(options);
      }
      if (dto.rows) {
        const rows = dto.rows.map(r => manager.create(SurveyQuestionRow, { question_id: saved.id, ...r }));
        await manager.save(rows);
      }

      await manager.query(`INSERT INTO audit_logs (action, actor_id, target_id) VALUES ($1, $2, $3)`, ['survey.question.add', actorId, saved.id]);
      return saved;
    });
  }

  async updateQuestion(surveyId: string, questionId: string, dto: UpdateQuestionDto, actorId: string) {
    return this.dataSource.transaction(async manager => {
      const question = await manager.findOne(SurveyQuestion, { where: { id: questionId, survey_id: surveyId } });
      if (!question) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Soru bulunamadı.' });

      // Build mock for validation
      const mockForVal = { ...question, ...dto } as any;
      this.validateQuestionRules(mockForVal);

      // is_reversed is immutable
      if (dto.hasOwnProperty('is_reversed')) {
        delete (dto as any).is_reversed; 
      }

      const { options, rows, ...fieldsToUpdate } = dto;
      Object.assign(question, fieldsToUpdate);
      await manager.save(question);

      if (options) {
        await manager.delete(SurveyQuestionOption, { question_id: questionId });
        const newOpts = options.map(o => manager.create(SurveyQuestionOption, { question_id: questionId, ...o }));
        await manager.save(newOpts);
      }

      if (rows) {
        await manager.delete(SurveyQuestionRow, { question_id: questionId });
        const newRows = rows.map(r => manager.create(SurveyQuestionRow, { question_id: questionId, ...r }));
        await manager.save(newRows);
      }

      await manager.query(`INSERT INTO audit_logs (action, actor_id, target_id) VALUES ($1, $2, $3)`, ['survey.question.update', actorId, questionId]);
      return question;
    });
  }

  async deleteQuestion(surveyId: string, questionId: string) {
    const res = await this.questionRepository.delete({ id: questionId, survey_id: surveyId });
    if (res.affected === 0) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Soru bulunamadı.' });
    return { success: true };
  }

  async reorderQuestions(surveyId: string, dto: ReorderQuestionsDto) {
    return this.dataSource.transaction(async manager => {
      for (const item of dto.questions) {
        await manager.update(SurveyQuestion, { id: item.id, survey_id: surveyId }, { order_index: item.order_index });
      }
      return { success: true };
    });
  }

  async assignSurvey(id: string, dto: AssignSurveyDto, actorId: string) {
    // 1. Check if survey exists
    const survey = await this.surveyRepository.findOne({ where: { id } });
    if (!survey) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Anket bulunamadı.' });

    let companyIds = dto.company_ids;

    // 2. If company_ids is null, fetch all active companies
    if (!companyIds) {
      const activeCompanies = await this.companyRepository.find({
        where: { is_active: true },
        select: ['id']
      });
      companyIds = activeCompanies.map(c => c.id);
    }

    let assignedCount = 0;
    let skippedCount = 0;

    // 3. For each company, check for existing assignment and insert if not present
    for (const companyId of companyIds) {
      const exists = await this.assignmentRepository.findOne({
        where: { 
          survey_id: id, 
          company_id: companyId,
          period: dto.period
        }
      });

      if (exists) {
        skippedCount++;
        continue;
      }

      const assignment = this.assignmentRepository.create({
        survey_id: id,
        company_id: companyId,
        department_id: dto.department_id,
        period: dto.period,
        due_at: dto.due_at ? new Date(dto.due_at) : null,
        status: 'active',
        assigned_by: actorId
      });

      await this.assignmentRepository.save(assignment);

      // If survey is NOT anonymous, ensure company has employee accounts enabled
      if (survey.is_anonymous === false) {
        await this.companyService.updateSettings(
          companyId,
          { employee_accounts: true },
          { id: actorId } // Pass actor as requesting user
        );
      }

      assignedCount++;
    }

    // 4. Audit Log
    await this.dataSource.query(
      `INSERT INTO audit_logs (action, actor_id, target_id, metadata) VALUES ($1, $2, $3, $4)`,
      ['survey.assign', actorId, id, JSON.stringify({ assigned_count: assignedCount, skipped_count: skippedCount, period: dto.period })]
    );

    return { assigned_count: assignedCount, skipped_count: skippedCount };
  }

  async getCompanySurveys(companyId: string) {
    // 1. survey_assignments aracılığıyla atananlar (admin assign)
    const assignments = await this.assignmentRepository.find({
      where: { company_id: companyId },
      relations: ['survey'],
      order: { assigned_at: 'DESC' }
    });

    const assignmentData = await Promise.all(assignments.map(async (a) => {
      const campaignCount = await this.dataSource.query(
        `SELECT COUNT(*) as count FROM distribution_campaigns 
         WHERE survey_id = $1 AND company_id = $2 AND period = $3`,
        [a.survey_id, a.company_id, a.period]
      );
      return {
        id: a.id,
        survey_id: a.survey_id,
        title: a.survey?.title_tr,
        type: a.survey?.type,
        period: a.period,
        due_at: a.due_at,
        status: a.status,
        campaign_count: parseInt(campaignCount[0]?.count) || 0,
        source: 'assignment'
      };
    }));

    // 2. Doğrudan company_id ile bağlı anketler (consultant tarafından oluşturulan)
    const directSurveys = await this.surveyRepository.find({
      where: { company_id: companyId, is_active: true },
      order: { created_at: 'DESC' }
    });

    // Assignment'ta olmayan direct survey'leri ekle (tekrar gösterme)
    const assignedSurveyIds = new Set(assignments.map(a => a.survey_id));
    const directData = await Promise.all(
      directSurveys
        .filter(s => !assignedSurveyIds.has(s.id))
        .map(async s => {
          const countRes = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM distribution_campaigns WHERE survey_id = $1 AND company_id = $2`,
            [s.id, companyId]
          );
          return {
            id: s.id,
            survey_id: s.id,
            title: s.title_tr,
            type: s.type,
            period: null,
            due_at: null,
            status: 'active',
            campaign_count: parseInt(countRes[0]?.count) || 0,
            source: 'direct'
          };
        })
    );

    return [...assignmentData, ...directData];
  }

  async findPendingForUser(userId: string, companyId: string) {
     const surveys = await this.surveyRepository.createQueryBuilder('s')
       .innerJoin('s.assignments', 'sa', 'sa.company_id = :companyId', { companyId })
       .where('s.is_active = true')
       .andWhere('(s.starts_at IS NULL OR s.starts_at <= NOW())')
       .andWhere('(s.ends_at IS NULL OR s.ends_at >= NOW())')
       .getMany();
     
     // Filter out already responded if not periodic
     return surveys; 
  }

  async findHistoryForUser(userId: string) {
    return this.dataSource.query(`
      SELECT s.id, s.title_tr, sr.submitted_at, sr.period
      FROM survey_responses sr
      JOIN surveys s ON s.id = sr.survey_id
      WHERE sr.user_id = $1
      ORDER BY sr.submitted_at DESC
    `, [userId]);
  }

  async findResults(id: string, companyId: string, period?: string) {
    // 1. Toplam gönderilen (distribution_campaigns)
    const sentRes = await this.dataSource.query(`
      SELECT COALESCE(SUM(total_recipients), 0) as total,
             COALESCE(SUM(completed_count), 0) as completed
      FROM distribution_campaigns
      WHERE survey_id = $1 AND company_id = $2
    `, [id, companyId]);

    const total = parseInt(sentRes[0]?.total ?? '0');
    const completed = parseInt(sentRes[0]?.completed ?? '0');
    const participation_rate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    // 2. Boyut skorları (survey_responses tablosundan)
    const dimensionRes = await this.dataSource.query(`
      SELECT sq.dimension, 
             ROUND(AVG(sqa.answer_value)::numeric, 1) as avg_score,
             COUNT(*) as answer_count
      FROM survey_responses sr
      JOIN response_answers sqa ON sqa.response_id = sr.id
      JOIN survey_questions sq ON sq.id = sqa.question_id
      WHERE sr.survey_id = $1 AND sr.company_id = $2
        AND sqa.answer_value IS NOT NULL
        ${period ? 'AND sr.period = $3' : ''}
      GROUP BY sq.dimension
    `, period ? [id, companyId, period] : [id, companyId]);

    const dimension_scores: Record<string, number | null> = {};
    for (const row of dimensionRes) {
      if (row.dimension) {
        dimension_scores[row.dimension] = parseFloat(row.avg_score) || null;
      }
    }

    // 3. Cevap sayısı
    const responseCountRes = await this.dataSource.query(`
      SELECT COUNT(*) as count FROM survey_responses
      WHERE survey_id = $1 AND company_id = $2
    `, [id, companyId]);
    const response_count = parseInt(responseCountRes[0]?.count ?? '0');

    const has_data = response_count > 0;

    return {
      has_data,
      participation_rate,
      total_sent: total,
      total_completed: completed,
      response_count,
      dimension_scores: has_data ? dimension_scores : null,
      question_distributions: [],
      latest_insight: has_data
        ? 'Veriler analiz ediliyor...'
        : null,
    };
  }

  // ------------------------------------------------------------------------
  // AI GENERATION & DRAFTS
  // ------------------------------------------------------------------------

  async generateWithAI(dto: AiGenerateSurveyDto) {
    return this.aiService.generateSurveyQuestions(
      dto.industry,
      dto.dimensions,
      dto.question_count,
      dto.language
    );
  }

  async saveDraft(userId: string, draftData: any) {
    let draft = await this.draftRepository.findOne({ where: { created_by: userId } });
    if (draft) {
      draft.draft_data = draftData;
    } else {
      draft = this.draftRepository.create({
        created_by: userId,
        draft_data: draftData
      });
    }
    return this.draftRepository.save(draft);
  }

  async getDraft(userId: string) {
    const draft = await this.draftRepository.findOne({ where: { created_by: userId } });
    return draft ? draft.draft_data : null;
  }

  async deleteDraft(userId: string) {
    await this.draftRepository.delete({ created_by: userId });
    return { success: true };
  }
}
