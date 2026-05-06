import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ConsultantReport } from './entities/consultant-report.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { AiInsight } from '../ai/entities/ai-insight.entity';
import { NotificationService } from '../notification/notification.service';
import { AppLogger } from '../../common/logger/app-logger.service';
import { ReportHtmlHelper } from '../report/helpers/report-html.helper';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';

@Injectable()
export class ConsultantReportsService {
  constructor(
    @InjectRepository(ConsultantReport)
    private readonly reportRepo: Repository<ConsultantReport>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AiInsight)
    private readonly insightRepo: Repository<AiInsight>,
    private readonly notificationService: NotificationService,
    private readonly reportHtmlHelper: ReportHtmlHelper,
    private readonly logger: AppLogger,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async generatePdf(id: string, consultantId: string): Promise<Buffer> {
    const report = await this.findOwned(id, consultantId);

    // ── Skor verisi çek ──────────────────────────────────────────
    const dimensions = ['overall','mental','physical','social','financial','work'];

    // Period formatını düzelt: '2026-05' → '2026-05-01'
    const periodDate = report.period
      ? (report.period.length === 7
          ? report.period + '-01'
          : report.period)
      : new Date().toISOString().slice(0, 7) + '-01';

    const prevDate = (() => {
      const d = new Date(periodDate);
      d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0, 10);
    })();

    // Benchmark (sektör)
    const industry = report.company?.industry ?? 'technology';
    const benchmarks = await this.dataSource.query(`
      SELECT dimension, AVG(score) as score
      FROM industry_benchmark_scores
      WHERE industry = $1 AND region = 'turkey'
      GROUP BY dimension
    `, [industry]);
    const benchMap: Record<string, number> = {};
    for (const b of benchmarks) benchMap[b.dimension] = Number(b.score);

    // Mevcut dönem skorları
    const currentScores = await this.dataSource.query(`
      SELECT dimension, AVG(score) as score
      FROM wellbeing_scores
      WHERE company_id = $1
        AND DATE_TRUNC('month', period::date) =
            DATE_TRUNC('month', $2::date)
      GROUP BY dimension
    `, [report.companyId, periodDate]);
    const currentMap: Record<string, number> = {};
    for (const s of currentScores) currentMap[s.dimension] = Number(s.score);

    // Önceki dönem
    const prevScores = await this.dataSource.query(`
      SELECT dimension, AVG(score) as score
      FROM wellbeing_scores
      WHERE company_id = $1
        AND DATE_TRUNC('month', period::date) =
            DATE_TRUNC('month', $2::date)
      GROUP BY dimension
    `, [report.companyId, prevDate]);
    const prevMap: Record<string, number> = {};
    for (const s of prevScores) prevMap[s.dimension] = Number(s.score);

    // Skor dizisi
    const scores = dimensions.map(dim => ({
      dimension:  dim,
      score:      currentMap[dim] ?? 0,
      benchmark:  benchMap[dim]   ?? 0,
      prev_score: prevMap[dim]    ?? null,
      label_tr:   dim,
      label_en:   dim,
    }));

    // Departman skorları
    const deptScores = await this.dataSource.query(`
      SELECT
        d.name as dept_name,
        AVG(ws.score) as score,
        COUNT(DISTINCT sr.id) as respondents
      FROM wellbeing_scores ws
      JOIN departments d ON d.id = ws.department_id
      LEFT JOIN survey_responses sr
        ON sr.department_id = ws.department_id
        AND sr.company_id = ws.company_id
      WHERE ws.company_id = $1
        AND ws.dimension = 'overall'
        AND DATE_TRUNC('month', ws.period::date) =
            DATE_TRUNC('month', $2::date)
        AND ws.department_id IS NOT NULL
      GROUP BY d.name
      ORDER BY score DESC
    `, [report.companyId, periodDate]);

    // Platform ayarları
    const settings = await this.dataSource.query(
      `SELECT platform_name, platform_logo_url FROM platform_settings LIMIT 1`
    );
    const setting = settings[0] ?? {};

    // Risk alanları
    const riskAreas = scores
      .filter(s => s.score > 0 && s.score < 45 && s.dimension !== 'overall')
      .map(s => s.dimension);

    // Katılımcı sayısı
    const respondentResult = await this.dataSource.query(`
      SELECT COUNT(DISTINCT id) as count
      FROM survey_responses
      WHERE company_id = $1
    `, [report.companyId]);

    // ── ReportHtmlHelper'a geçir ─────────────────────────────────
    return this.reportHtmlHelper.generatePdf({
      company_name:     report.company?.name ?? '',
      company_industry: industry,
      period:           report.period ?? '',
      language:         'tr',

      brand_name:          setting.platform_name ?? 'Wellbeing Metric',
      brand_logo_url:      setting.platform_logo_url ?? '',
      consultant_name:     report.consultant?.full_name ?? '',
      consultant_logo_url: '',
      is_white_label:      false,

      scores,
      departments: deptScores.map((d: any) => ({
        name:        d.dept_name,
        score:       Number(d.score),
        respondents: Number(d.respondents ?? 0),
      })),

      ai_content:        report.content ?? '',
      total_respondents: Number(respondentResult[0]?.count ?? 0),
      response_rate:     0,
      risk_areas:        riskAreas,
    }) as Promise<Buffer>;
  }

  // ── Taslak oluştur ───────────────────────────────────────────────
  async create(dto: CreateReportDto, consultantId: string) {
    this.logger.info('Yeni rapor taslağı oluşturuluyor', { service: 'ConsultantReportsService', method: 'create', userId: consultantId }, { dto });

    // Firma ownership kontrolü
    const company = await this.companyRepo.findOne({
      where: { id: dto.company_id, consultant_id: consultantId }
    });
    if (!company) throw new ForbiddenException('Bu firmaya erişim yetkiniz yok');

    const report = this.reportRepo.create({
      ...dto,
      companyId: dto.company_id, // Map snake_case to camelCase
      consultantId,
      status: 'draft',
    });

    return this.reportRepo.save(report);
  }

  // ── Taslak güncelle ──────────────────────────────────────────────
  async update(id: string, dto: UpdateReportDto, consultantId: string) {
    const report = await this.findOwned(id, consultantId);

    if (report.status === 'published') {
      throw new BadRequestException('Yayınlanmış rapor düzenlenemez. Önce taslağa alın.');
    }

    Object.assign(report, dto);
    return this.reportRepo.save(report);
  }

  // ── Taslağa geri al ─────────────────────────────────────────────
  async unpublish(id: string, consultantId: string) {
    const report = await this.findOwned(id, consultantId);
    await this.reportRepo.update(id, {
      status: 'draft',
      publishedAt: null,
    });
    return { unpublished: true };
  }

  // ── Yayınla → HR'a bildir ────────────────────────────────────────
  async publish(id: string, consultantId: string) {
    const report = await this.findOwned(id, consultantId);

    if (report.status === 'published') {
      throw new BadRequestException('Rapor zaten yayınlanmış');
    }
    if (!report.content || report.content.trim().length < 10) {
      throw new BadRequestException('Rapor içeriği çok kısa');
    }

    const now = new Date();

    // Yayınla
    await this.reportRepo.update(id, {
      status: 'published',
      publishedAt: now,
    });

    // HR admin'leri bul ve bildir
    const hrAdmins = await this.userRepo.find({
      where: { company_id: report.companyId, role: 'hr_admin', is_active: true }
    });

    this.logger.info('Rapor yayınlanıyor', {
      service: 'ConsultantReportsService',
      userId: consultantId,
      companyId: report.companyId,
      extra: { reportId: id }
    }, {
      hrCount: hrAdmins.length,
    });

    // Mail gönder
    for (const hr of hrAdmins) {
      await this.notificationService.sendEmail(hr.email, 'consultant_report_published', {
        hr_name: hr.full_name,
        consultant_name: report.consultant?.full_name,
        report_title: report.title,
        report_summary: report.summary ?? '',
        period: report.period ?? '',
        company_name: report.company?.name,
        report_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/reports/consultant/${id}`,
      });
    }

    // notified_at güncelle
    await this.reportRepo.update(id, { notifiedAt: now });

    return {
      published: true,
      recipients: hrAdmins.length,
    };
  }

  // ── Sil (sadece taslak silinebilir) ─────────────────────────────
  async remove(id: string, consultantId: string) {
    const report = await this.findOwned(id, consultantId);
    if (report.status === 'published') {
      throw new BadRequestException('Yayınlanmış rapor silinemez. Önce taslağa alın.');
    }
    await this.reportRepo.delete(id);
    return { deleted: true };
  }

  // ── Consultant rapor listesi ─────────────────────────────────────
  async findAll(consultantId: string, filters: {
    company_id?: string;
    status?: string;
  }) {
    const query: any = { consultantId };
    if (filters.company_id) query.companyId = filters.company_id;
    if (filters.status) query.status = filters.status;

    return this.reportRepo.find({
      where: query,
      relations: ['company'],
      order: { updatedAt: 'DESC' },
    });
  }

  // ── Tekil rapor ──────────────────────────────────────────────────
  async findOne(id: string, consultantId: string) {
    return this.findOwned(id, consultantId);
  }

  // ── HR: yayınlanmış raporları getir ─────────────────────────────
  async findPublishedForCompany(companyId: string) {
    return this.reportRepo.find({
      where: { companyId, status: 'published' },
      relations: ['consultant'],
      order: { isPinned: 'DESC', publishedAt: 'DESC' },
    });
  }

  // ── HR: tek rapor oku ────────────────────────────────────────────
  async findOnePublished(id: string, companyId: string) {
    const report = await this.reportRepo.findOne({
      where: { id, companyId, status: 'published' },
      relations: ['consultant'],
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    return report;
  }

  // ── AI insight'tan içerik oluştur ────────────────────────────────
  async createFromInsights(
    insightIds: string[],
    dto: CreateReportDto,
    consultantId: string,
  ) {
    const insights = await this.insightRepo.find({
      where: { id: In(insightIds) }
    });

    // Insight içeriklerini birleştir
    const combinedContent = insights
      .map(i => `## ${i.insight_type}\n\n${i.content}`)
      .join('\n\n---\n\n');

    return this.create({
      ...dto,
      content: combinedContent,
      ai_insight_ids: insightIds,
    }, consultantId);
  }

  // ── Yardımcı ─────────────────────────────────────────────────────
  private async findOwned(id: string, consultantId: string) {
    const report = await this.reportRepo.findOne({
      where: { id, consultantId },
      relations: ['consultant', 'company'],
    });
    if (!report) throw new NotFoundException('Rapor bulunamadı');
    return report;
  }
}
