import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyDraft } from '../survey/entities/survey-draft.entity';
import { Company } from '../company/entities/company.entity';
import { CreateConsultantSurveyDto } from './dto/create-consultant-survey.dto';
import { UpdateConsultantSurveyDto } from './dto/update-consultant-survey.dto';
import { AssignConsultantSurveyDto } from './dto/assign-consultant-survey.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ConsultantSurveysService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyQuestion) private questionRepo: Repository<SurveyQuestion>,
    @InjectRepository(SurveyAssignment) private assignmentRepo: Repository<SurveyAssignment>,
    @InjectRepository(SurveyDraft) private draftRepo: Repository<SurveyDraft>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  // ── findAll ──────────────────────────────────────────────────────
  async findAll(consultantId: string) {
    // Consultant'ın firmalarına ait anketler
    // + global anketler (atama için listelenebilir)
    const ownCompanies = await this.companyRepo.find({ 
      where: { consultant_id: consultantId }, 
      select: ['id'] 
    });
    const ownCompanyIds = ownCompanies.map(c => c.id);

    const query = this.surveyRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.company', 'company')
      .where('s.company_id IS NULL'); // global anketler

    if (ownCompanyIds.length > 0) {
      query.orWhere('s.company_id IN (:...ids)', { ids: ownCompanyIds });
    }

    return query.orderBy('s.created_at', 'DESC').getMany();
  }

  // ── findOne ──────────────────────────────────────────────────────
  async findOne(id: string, consultantId: string) {
    const survey = await this.surveyRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'questions.rows'],
    });
    if (!survey) throw new NotFoundException('Anket bulunamadı');

    // Global anketler herkes görebilir
    if (survey.company_id !== null && survey.created_by !== consultantId) {
      throw new ForbiddenException('SURVEY_NOT_OWNED');
    }
    return survey;
  }

  // ── create ───────────────────────────────────────────────────────
  async create(dto: CreateConsultantSurveyDto, consultantId: string) {
    // Firma ownership kontrolü
    const company = await this.companyRepo.findOne({
      where: { id: dto.company_id, consultant_id: consultantId },
    });
    if (!company) throw new ForbiddenException('TENANT_MISMATCH');

    // questions'ı ayır — cascade çift kayıt sorununu önle
    const { questions, ...surveyData } = dto;

    const survey = this.surveyRepo.create({
      ...surveyData,
      type: 'company_specific',
      created_by: consultantId,
      isPoolVisible: true,
      poolAddedAt: new Date(),
      is_active: true,
      is_anonymous: dto.is_anonymous ?? true,
      throttle_days: dto.throttle_days ?? 7,
    });
    const saved = await this.surveyRepo.save(survey) as any;

    // Soruları kaydet (her biri için order_index varsa koru, yoksa sıra numarasını ver)
    if (questions?.length) {
      const questionEntities = questions.map((q, idx) =>
        this.questionRepo.create({
          ...q,
          survey_id: saved.id,
          order_index: q.order_index ?? idx,
          question_type: q.question_type ?? 'likert5',
          dimension: q.dimension ?? 'overall',
          weight: q.weight ?? 1.0,
        })
      );
      await this.questionRepo.save(questionEntities);
    }

    // Taslağı temizle
    await this.draftRepo.delete({ created_by: consultantId });

    return this.findOne(saved.id, consultantId);
  }

  // ── update ───────────────────────────────────────────────────────
  async update(id: string, dto: UpdateConsultantSurveyDto, consultantId: string) {
    const survey = await this.surveyRepo.findOne({ where: { id } });
    if (!survey) throw new NotFoundException('Anket bulunamadı');

    const { questions, ...surveyData } = dto;
    Object.assign(survey, surveyData);
    await this.surveyRepo.save(survey);

    // Soruları güncelle: sil + yeniden ekle
    if (questions) {
      await this.questionRepo.delete({ survey_id: id });
      const newQuestions = questions.map(q =>
        this.questionRepo.create({ ...q, survey_id: id })
      );
      await this.questionRepo.save(newQuestions);
    }

    return this.findOne(id, consultantId);
  }

  // ── remove ───────────────────────────────────────────────────────
  async remove(id: string) {
    // Aktif atama kontrolü
    const activeAssignment = await this.assignmentRepo.findOne({
      where: { survey_id: id, status: 'active' },
    });
    if (activeAssignment) {
      throw new ConflictException('SURVEY_HAS_ACTIVE_ASSIGNMENT');
    }

    await this.surveyRepo.softDelete(id);
    return { deleted: true };
  }

  // ── assign ───────────────────────────────────────────────────────
  async assign(dto: AssignConsultantSurveyDto, consultantId: string) {
    // Check if consultant owns all target companies
    const companies = await this.companyRepo.find({
      where: { consultant_id: consultantId },
    });
    const ownCompanyIds = companies.map(c => c.id);
    
    for (const companyId of dto.company_ids) {
      if (!ownCompanyIds.includes(companyId)) {
        throw new ForbiddenException(`TENANT_MISMATCH: ${companyId}`);
      }
    }

    // Create assignments
    const assignments = dto.company_ids.map(companyId => 
      this.assignmentRepo.create({
        survey_id: dto.survey_id,
        company_id: companyId,
        period: dto.period,
        due_at: new Date(dto.due_at),
        status: 'active',
        assigned_by: consultantId
      } as any)
    );

    await this.assignmentRepo.save(assignments as any);

    // Send notifications to HR for each company
    const survey = await this.surveyRepo.findOne({ where: { id: dto.survey_id } });
    if (survey) {
      for (const company of companies) {
        if (dto.company_ids.includes(company.id)) {
          // Find HR user for this company
          const hrUser = await this.userRepo.findOne({
            where: { company_id: company.id, role: 'hr_admin', is_active: true }
          });
          
          if (hrUser || company.contact_email) {
            await this.notificationService.sendSurveyAssigned(
              hrUser?.email || company.contact_email,
              hrUser?.full_name || 'HR Yöneticisi',
              company.name,
              survey.title_tr,
              dto.period,
              new Date(dto.due_at),
              hrUser?.language || (company.settings as any)?.language || 'tr',
              company.id,
              consultantId
            );
          }
        }
      }
    }

    return { success: true, count: assignments.length };
  }

  // ── getDraft ─────────────────────────────────────────────────────
  async getDraft(consultantId: string) {
    return this.draftRepo.findOne({ where: { created_by: consultantId } });
  }

  // ── saveDraft ────────────────────────────────────────────────────
  async saveDraft(data: any, consultantId: string) {
    await this.draftRepo.upsert(
      { created_by: consultantId, draft_data: data, last_saved_at: new Date() },
      ['created_by'],
    );
    return { saved: true };
  }

  // ── deleteDraft ──────────────────────────────────────────────────
  async deleteDraft(consultantId: string) {
    await this.draftRepo.delete({ created_by: consultantId });
    return { deleted: true };
  }

  async setPoolVisibility(
    surveyId: string,
    consultantId: string,
    visible: boolean,
  ): Promise<void> {
    // Ownership kontrolü
    const survey = await this.surveyRepo.findOne({
      where: { id: surveyId, created_by: consultantId },
    });
    if (!survey) throw new ForbiddenException('SURVEY_NOT_OWNED');

    await this.surveyRepo.update(surveyId, {
      isPoolVisible: visible,
      // Gizlendikten sonra tekrar açılınca pool_added_at güncelle
      poolAddedAt: visible ? new Date() : survey.poolAddedAt,
    });
  }
}
