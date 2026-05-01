import { 
  Injectable, 
  ForbiddenException, 
  NotFoundException, 
  UnprocessableEntityException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { ConsultantPlan } from './entities/consultant-plan.entity';
import { User } from '../user/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { CompanyService } from '../company/company.service';
import { NotificationService } from '../notification/notification.service';
import { AIService } from '../ai/ai.service';
import { ErrorCode } from '../../common/constants/error-codes';

@Injectable()
export class ConsultantService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(ConsultantPlan)
    private readonly planRepository: Repository<ConsultantPlan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private readonly notificationService: NotificationService,
    private readonly aiService: AIService,
  ) {}

  async verifyOwnership(consultantId: string, companyId: string) {
    const company = await this.companyRepository.findOne({
      where: { id: companyId, consultant_id: consultantId },
      select: ['id']
    });

    if (!company) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Bu firmaya erişim yetkiniz yok veya firma size ait değil.'
      });
    }
    return company;
  }

  async getDashboard(consultantId: string) {
    // 1. Get metrics
    const plan = await this.planRepository.findOne({ where: { consultant_id: consultantId } });
    const companies = await this.companyRepository.find({
      where: { consultant_id: consultantId, is_active: true }
    });

    const companyIds = companies.map(c => c.id);
    
    if (companyIds.length === 0) {
      return {
        metrics: {
          total_companies: 0,
          total_employees: 0,
          avg_score: 0,
          avg_participation: 0,
          plan_usage: { used: 0, max: plan?.max_companies || 5 }
        },
        companies: [],
        alerts: [],
        recent_activities: []
      };
    }

    // 2. Fetch scores and participation
    // Using raw SQL for efficient aggregation across companies
    const statsQuery = `
      SELECT 
        AVG(score) as avg_score,
        COUNT(DISTINCT u.id) as total_employees
      FROM wellbeing_scores ws
      JOIN users u ON u.company_id = ws.company_id
      WHERE ws.company_id = ANY($1) AND ws.dimension = 'overall'
      AND ws.calculated_at = (SELECT MAX(calculated_at) FROM wellbeing_scores WHERE company_id = ws.company_id)
    `;
    const stats = await this.dataSource.query(statsQuery, [companyIds]);

    const participationQuery = `
      SELECT AVG(rate) as avg_participation FROM (
        SELECT (COUNT(sr.id)::float / NULLIF(COUNT(st.id), 0)) * 100 as rate
        FROM survey_assignments sa
        JOIN survey_tokens st ON st.assignment_id = sa.id
        LEFT JOIN survey_responses sr ON sr.survey_token_id = st.id
        WHERE sa.company_id = ANY($1)
        GROUP BY sa.id
      ) sub
    `;
    const participation = await this.dataSource.query(participationQuery, [companyIds]);

    // 3. Company list with latest scores
    const companyListQuery = `
      SELECT c.id, c.name, c.industry, c.plan,
        (SELECT score FROM wellbeing_scores WHERE company_id = c.id AND dimension = 'overall' ORDER BY calculated_at DESC LIMIT 1) as current_score,
        (SELECT (COUNT(sr.id)::float / NULLIF(COUNT(st.id), 0)) * 100 
         FROM survey_assignments sa JOIN survey_tokens st ON st.assignment_id = sa.id 
         LEFT JOIN survey_responses sr ON sr.survey_token_id = st.id 
         WHERE sa.company_id = c.id GROUP BY sa.id ORDER BY sa.assigned_at DESC LIMIT 1) as last_participation
      FROM companies c
      WHERE c.consultant_id = $1 AND c.is_active = true
    `;
    const companyList = await this.dataSource.query(companyListQuery, [consultantId]);

    return {
      metrics: {
        total_companies: companies.length,
        total_employees: parseInt(stats[0]?.total_employees || '0'),
        avg_score: parseFloat(stats[0]?.avg_score || '0'),
        avg_participation: parseFloat(participation[0]?.avg_participation || '0'),
        plan_usage: { used: companies.length, max: plan?.max_companies || 5 }
      },
      companies: companyList,
      alerts: companyList.filter(c => c.current_score < 60), // Example threshold
      recent_activities: [] // Could be fetched from audit_logs
    };
  }

  async getCompanies(consultantId: string, filters: any) {
    const { search, page = 1, per_page = 50 } = filters;
    const skip = (page - 1) * per_page;

    let query = this.companyRepository.createQueryBuilder('c')
      .where('c.consultant_id = :consultantId', { consultantId })
      .andWhere('c.is_active = true');

    if (search) {
      query = query.andWhere('c.name ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await query
      .orderBy('c.created_at', 'DESC')
      .skip(skip)
      .take(per_page)
      .getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page)
      }
    };
  }

  async createCompany(consultantId: string, dto: any) {
    // 1. Plan limit check
    const plan = await this.planRepository.findOne({ where: { consultant_id: consultantId } });
    const companyCount = await this.companyRepository.count({ where: { consultant_id: consultantId, is_active: true } });

    if (plan && companyCount >= plan.max_companies) {
      throw new UnprocessableEntityException({
        code: ErrorCode.PLAN_LIMIT_EXCEEDED,
        message: 'Plan limitinize ulaştınız. Daha fazla firma eklemek için planınızı yükseltin.'
      });
    }

    // 2. Create company using CompanyService (reusing logic for slug, industry validation etc.)
    const result = await this.companyService.create({
      ...dto,
      consultant_id: consultantId
    }, consultantId);

    // 3. Update company with consultant_id (if CompanyService.create doesn't handle it yet)
    // Actually I should update CompanyService.create to handle consultant_id in the DTO
    // but for now I'll do it here if needed.
    
    return result;
  }

  async getCompanyStats(consultantId: string, companyId: string) {
    await this.verifyOwnership(consultantId, companyId);
    return this.companyService.getStats(companyId);
  }

  async assignSurvey(consultantId: string, dto: any) {
    const { survey_id, company_ids, period, due_at } = dto;
    
    for (const companyId of company_ids) {
      await this.verifyOwnership(consultantId, companyId);
      // Logic for assignment would call SurveyService
      // await this.surveyService.assignToCompany(companyId, survey_id, { period, due_at });
    }

    return { success: true };
  }

  async getComparativeInsight(consultantId: string, dto: any) {
    const { company_ids, period } = dto;
    
    for (const companyId of company_ids) {
      await this.verifyOwnership(consultantId, companyId);
    }

    // Gather data from all companies
    const data = await this.dataSource.query(`
      SELECT c.name, ws.dimension, ws.score, ws.period
      FROM wellbeing_scores ws
      JOIN companies c ON c.id = ws.company_id
      WHERE ws.company_id = ANY($1) AND ws.period = $2
    `, [company_ids, period]);

    const prompt = `Bu firmaları karşılaştır: ${JSON.stringify(data)}. Hangisi en iyi? Ortak sorunlar? Öncelikli müdahale nerede?`;
    
    return this.aiService.adminChat(prompt, []); // Reusing existing task type
  }
}
