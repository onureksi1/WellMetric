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
import { DepartmentService } from '../department/department.service';
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
    private readonly departmentService: DepartmentService,
  ) {}

  async verifyOwnership(consultantId: string, companyId: string) {
    const isUuid = companyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    const whereClause = isUuid ? { id: companyId, consultant_id: consultantId } : { slug: companyId, consultant_id: consultantId };
    
    const company = await this.companyRepository.findOne({
      where: whereClause,
      select: ['id', 'name', 'industry', 'plan', 'slug']
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
    console.log(`[ConsultantService] Fetching dashboard for consultant: ${consultantId}`);
    // 1. Get metrics
    const plan = await this.planRepository.findOne({ where: { consultant_id: consultantId } });
    const companies = await this.companyRepository.find({
      where: { consultant_id: consultantId, is_active: true }
    });

    const companyIds = companies.map(c => c.id);
    console.log(`[ConsultantService] Found ${companies.length} companies for consultant: ${companyIds.join(', ')}`);
    
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

    // 2. Fetch scores, employee count, and active surveys
    const employeeCount = await this.dataSource.query(
      'SELECT COUNT(*)::int as count FROM employees WHERE company_id = ANY($1) AND is_active = true',
      [companyIds]
    );
    console.log(`[ConsultantService] Employee count result:`, employeeCount);

    // Active surveys for all consultant companies
    const activeSurveysRes = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM surveys WHERE company_id = ANY($1) AND is_active = true`,
      [companyIds]
    );

    const statsQuery = `
      SELECT AVG(score) as avg_score
      FROM wellbeing_scores ws
      WHERE ws.company_id = ANY($1)
        AND ws.dimension = 'overall'
        AND ws.department_id IS NULL
        AND ws.segment_type IS NULL
        AND ws.calculated_at = (
          SELECT MAX(calculated_at) FROM wellbeing_scores
          WHERE company_id = ws.company_id
            AND dimension = 'overall'
            AND department_id IS NULL
            AND segment_type IS NULL
        )
    `;
    const stats = await this.dataSource.query(statsQuery, [companyIds]);

    const participationQuery = `
      SELECT
        CASE
          WHEN SUM(total_tokens) = 0 THEN 0
          ELSE ROUND((SUM(used_tokens)::float / SUM(total_tokens)) * 100)
        END as avg_participation
      FROM (
        SELECT
          company_id,
          COUNT(*) as total_tokens,
          COUNT(CASE WHEN is_used = true THEN 1 END) as used_tokens
        FROM survey_tokens
        WHERE company_id = ANY($1)
        GROUP BY company_id
      ) sub
    `;
    const participation = await this.dataSource.query(participationQuery, [companyIds]);

    // 3. Company list with latest scores
    const companyListQuery = `
      SELECT
        c.id,
        c.name,
        c.industry,
        c.plan,
        ROUND(
          (SELECT score FROM wellbeing_scores
           WHERE company_id = c.id
             AND dimension = 'overall'
             AND department_id IS NULL
             AND segment_type IS NULL
           ORDER BY calculated_at DESC LIMIT 1)::numeric,
          1
        ) as score,
        COALESCE(
          (
            SELECT ROUND(
              (COUNT(CASE WHEN is_used = true THEN 1 END)::float / NULLIF(COUNT(*), 0)) * 100
            )
            FROM survey_tokens
            WHERE company_id = c.id
          ),
          0
        ) as participation,
        CASE
          WHEN (SELECT id FROM wellbeing_scores
                WHERE company_id = c.id AND dimension = 'overall'
                  AND department_id IS NULL AND segment_type IS NULL
                LIMIT 1) IS NULL THEN 'new'
          WHEN (
            SELECT score FROM wellbeing_scores ws2
            WHERE ws2.company_id = c.id AND ws2.dimension = 'overall'
              AND ws2.department_id IS NULL AND ws2.segment_type IS NULL
            ORDER BY ws2.calculated_at DESC LIMIT 1
          ) > (
            SELECT score FROM wellbeing_scores ws3
            WHERE ws3.company_id = c.id AND ws3.dimension = 'overall'
              AND ws3.department_id IS NULL AND ws3.segment_type IS NULL
            ORDER BY ws3.calculated_at DESC LIMIT 1 OFFSET 1
          ) + 2 THEN 'up'
          WHEN (
            SELECT score FROM wellbeing_scores ws2
            WHERE ws2.company_id = c.id AND ws2.dimension = 'overall'
              AND ws2.department_id IS NULL AND ws2.segment_type IS NULL
            ORDER BY ws2.calculated_at DESC LIMIT 1
          ) < (
            SELECT score FROM wellbeing_scores ws3
            WHERE ws3.company_id = c.id AND ws3.dimension = 'overall'
              AND ws3.department_id IS NULL AND ws3.segment_type IS NULL
            ORDER BY ws3.calculated_at DESC LIMIT 1 OFFSET 1
          ) - 2 THEN 'down'
          ELSE 'stable'
        END as status
      FROM companies c
      WHERE c.consultant_id = $1 AND c.is_active = true
    `;
    const companyList = await this.dataSource.query(companyListQuery, [consultantId]);

    return {
      metrics: {
        total_companies: companies.length,
        total_employees: employeeCount[0]?.count || 0,
        avg_score: parseFloat(stats[0]?.avg_score || '0'),
        avg_participation: parseFloat(participation[0]?.avg_participation || '0'),
        active_surveys: activeSurveysRes[0]?.count || 0,
        plan_usage: { used: companies.length, max: plan?.max_companies || 5 }
      },
      companies: companyList,
      alerts: companyList.filter((c: any) => c.score !== null && Number(c.score) < 60), // companies below threshold
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

    const enriched = await Promise.all(items.map(async (company: any) => {
      // 1. Toplam çalışan sayısı
      const employeeCount = await this.dataSource.query(`
        SELECT COUNT(*)::int as count
        FROM employees
        WHERE company_id = $1 AND is_active = true
      `, [company.id]);

      // 2. Son wellbeing skoru (overall)
      const latestScore = await this.dataSource.query(`
        SELECT score, period
        FROM wellbeing_scores
        WHERE company_id = $1
          AND dimension = 'overall'
          AND department_id IS NULL
        ORDER BY calculated_at DESC
        LIMIT 1
      `, [company.id]);

      // 3. Son anket tarihi
      const lastSurvey = await this.dataSource.query(`
        SELECT MAX(submitted_at) as last_date
        FROM survey_responses
        WHERE company_id = $1
      `, [company.id]);

      // 4. Departman sayısı
      const deptCount = await this.dataSource.query(`
        SELECT COUNT(*)::int as count
        FROM departments
        WHERE company_id = $1 AND is_active = true
      `, [company.id]);

      return {
        ...company,
        employee_count:   employeeCount[0]?.count ?? 0,
        department_count: deptCount[0]?.count ?? 0,
        wellbeing_score:  latestScore[0] ? Math.round(Number(latestScore[0].score) * 10) / 10 : null,
        last_period:      latestScore[0]?.period ?? null,
        last_survey_date: lastSurvey[0]?.last_date ?? null,
      };
    }));

    return {
      data: enriched,
      meta: {
        total,
        page: Number(page),
        per_page: Number(per_page),
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
    const company = await this.verifyOwnership(consultantId, companyId);
    const resolvedId = company.id;

    // 2. Get latest scores for all dimensions (company-level only, no department/segment breakdown)
    let scores: any[] = [];
    try {
      scores = await this.dataSource.query(`
        SELECT dimension, score, calculated_at
        FROM wellbeing_scores ws
        WHERE ws.company_id = $1
          AND ws.department_id IS NULL
          AND ws.segment_type IS NULL
          AND ws.calculated_at = (
            SELECT MAX(calculated_at) FROM wellbeing_scores
            WHERE company_id = ws.company_id
              AND department_id IS NULL
              AND segment_type IS NULL
          )
      `, [resolvedId]);
    } catch (e) { /* no scores yet */ }

    const overallScore = scores.find((s: any) => s.dimension === 'overall')?.score || 0;

    // 3. Get Trend Data — period column is 'YYYY-MM', company-level only
    let trendData: any[] = [];
    try {
      trendData = await this.dataSource.query(`
        SELECT 
          TO_CHAR(TO_DATE(period || '-01', 'YYYY-MM-DD'), 'Mon') as month,
          ROUND(score::numeric, 1) as score
        FROM wellbeing_scores
        WHERE company_id = $1
          AND dimension = 'overall'
          AND department_id IS NULL
          AND segment_type IS NULL
        ORDER BY period ASC
        LIMIT 6
      `, [resolvedId]);
    } catch (e) { /* no trend data yet */ }

    // 4. Get Participation — use survey_tokens.is_used as source of truth
    let participationRate = 0;
    let lastSurveyAt: string | null = null;
    try {
      const participationRes = await this.dataSource.query(`
        SELECT
          CASE WHEN total_tokens = 0 THEN 0
               ELSE ROUND((used_tokens::float / total_tokens) * 100)
          END as rate,
          (SELECT MAX(submitted_at) FROM survey_responses WHERE company_id = $1) as last_survey_at
        FROM (
          SELECT
            COUNT(*) as total_tokens,
            COUNT(CASE WHEN is_used = true THEN 1 END) as used_tokens
          FROM survey_tokens
          WHERE company_id = $1
        ) t
      `, [resolvedId]);
      participationRate = participationRes[0]?.rate || 0;
      lastSurveyAt = participationRes[0]?.last_survey_at || null;
    } catch (e) { /* participation query failed (non-fatal) */ }

    // 5. Get Departments with scores — try department_id first, fallback to company_id-scoped scores
    let departments: any[] = [];
    try {
      departments = await this.dataSource.query(`
        SELECT
          d.id,
          d.name,
          COALESCE(
            (SELECT ROUND(score::numeric, 1) FROM wellbeing_scores
             WHERE department_id = d.id AND dimension = 'overall'
             ORDER BY calculated_at DESC LIMIT 1),
            (SELECT ROUND(score::numeric, 1) FROM wellbeing_scores
             WHERE company_id = $1 AND department_id IS NULL AND dimension = 'overall'
             ORDER BY calculated_at DESC LIMIT 1)
          ) as score
        FROM departments d
        WHERE d.company_id = $1 AND d.is_active = true
        ORDER BY d.name ASC
      `, [resolvedId]);
    } catch (e) { /* no departments yet */ }

    // 6. Get Industry Label (industries table may not exist on all envs)
    let industryInfo: any[] = [];
    try {
      industryInfo = await this.dataSource.query(`
        SELECT label_tr, label_en FROM industries WHERE slug = $1
      `, [company?.industry]);
    } catch (e) { /* industries table may not exist */ }

    // 7. Employee count from employees table
    let employeeCount = 0;
    try {
      const res = await this.dataSource.query(
        `SELECT COUNT(*)::int as count FROM employees WHERE company_id = $1 AND is_active = true`,
        [resolvedId]
      );
      employeeCount = res[0]?.count || 0;
    } catch (e) {
      // Fallback to users table
      try {
        employeeCount = await this.userRepository.count({ where: { company_id: resolvedId, is_active: true } as any });
      } catch (_) { /* ignore */ }
    }

    return {
      company: {
        ...company,
        score: overallScore ? Number(overallScore).toFixed(2) : null,
        participation: participationRate,
        last_survey_at: lastSurveyAt,
        industry_label_tr: industryInfo[0]?.label_tr,
        industry_label_en: industryInfo[0]?.label_en,
        employee_count: employeeCount,
      },
      dimensions: [
        { name: 'Zihinsel Sağlık', score: scores.find((s: any) => s.dimension === 'mental')?.score || 0 },
        { name: 'Fiziksel Sağlık', score: scores.find((s: any) => s.dimension === 'physical')?.score || 0 },
        { name: 'İş Tatmini',      score: scores.find((s: any) => s.dimension === 'work')?.score || 0 },
        { name: 'Sosyal Bağlılık', score: scores.find((s: any) => s.dimension === 'social')?.score || 0 }
      ],
      trend_data: trendData.length > 0 ? trendData : [
        { month: 'Oca', score: 0 },
        { month: 'Şub', score: 0 },
        { month: 'Mar', score: 0 }
      ],
      departments: departments.map((d: any) => ({
        name: d.name,
        score: d.score ? Number(d.score) : null
      })),
      alerts: overallScore < 60 && overallScore > 0 ? [
        { title: 'Düşük Esenlik Skoru', message: 'Şirket genel esenlik skoru kritik seviyenin altında. Acil aksiyon planı önerilir.' }
      ] : []
    };
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

  async getDepartments(consultantId: string, companyId: string) {
    const company = await this.verifyOwnership(consultantId, companyId);
    return this.departmentService.findAll(company.id);
  }
}
