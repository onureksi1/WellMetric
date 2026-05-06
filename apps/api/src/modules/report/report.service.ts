import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ExportReportDto } from './dto/export-report.dto';
import { ScoreService } from '../score/score.service';
import { AIService } from '../ai/ai.service';
import { ActionService } from '../action/action.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { LogoHelper } from './helpers/logo.helper';
import { PdfTemplateHelper, ReportColors } from './helpers/pdf-template.helper';
import { ReportHtmlHelper } from './helpers/report-html.helper';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectQueue('report-queue') private readonly reportQueue: Queue,
    private readonly dataSource: DataSource,
    private readonly scoreService: ScoreService,
    @Inject(forwardRef(() => AIService))
    private readonly aiService: AIService,
    private readonly actionService: ActionService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    private readonly logoHelper: LogoHelper,
    private readonly reportHtmlHelper: ReportHtmlHelper,
  ) {}

  async requestExport(companyId: string, requestedBy: string, dto: ExportReportDto) {
    const jobId = uuidv4();
    const period = dto.period;
    const format = dto.format;
    const language = dto.language || 'tr';

    await this.reportQueue.add('generate', {
      companyId,
      requestedBy,
      period,
      format,
      language,
      jobId,
    }, {
      attempts: 3,
      backoff: { type: 'fixed', delay: 300000 }, // 5 mins
    });

    await this.auditService.logAction(
      requestedBy,
      companyId,
      'report.requested',
      'reports',
      undefined,
      { period, format, jobId }
    );

    return {
      job_id: jobId,
      message: 'Rapor hazırlanıyor. Hazır olduğunda mail ile bildirileceksiniz.',
    };
  }

  private async getS3Client() {
    const settings = await this.settingsService.getSettings();
    const accessKey = await this.settingsService.getDecryptedApiKey('storage_access_key'); // Assuming logic to get storage keys
    const secretKey = await this.settingsService.getDecryptedApiKey('storage_secret_key');

    return new S3Client({
      region: settings.storage_region || 'auto',
      endpoint: settings.storage_endpoint || undefined,
      credentials: {
        accessKeyId: accessKey || '',
        secretAccessKey: secretKey || '',
      },
    });
  }

  async generatePdf(companyId: string, period: string, language: string, jobId: string, requestedBy: string) {
    try {
      // 1. Data Collection
      const companyRes = await this.dataSource.query(`SELECT name, logo_url, industry FROM companies WHERE id = $1`, [companyId]);
      const company = companyRes[0];
      const scores = await this.scoreService.getCompanyScore(companyId, period);
      const deptScores = await this.scoreService.getDepartmentScores(companyId, period);
      const trend = await this.scoreService.getTrend(companyId, 12);
      const benchmark = await this.scoreService.getBenchmark(companyId, period);
      const insights = await this.aiService.getInsights(companyId, { period, page: 1, per_page: 3 });
      const actions = await this.actionService.findAll(companyId, { page: 1, per_page: 50 });
      
      const participationRes = await this.dataSource.query(
        `SELECT COUNT(*) as total FROM survey_tokens WHERE company_id = $1 AND is_used = true`, [companyId]
      );
      const participationRate = 85;

      const settings = await this.settingsService.getSettings();
      const consultant = await this.dataSource.query(`SELECT full_name, logo_url FROM users WHERE id = $1`, [requestedBy]);

      const mappedScores = [
        { dimension: 'overall',   score: scores.overall || 0,   benchmark: benchmark.overall || 70, prev_score: null, label_tr: 'Genel', label_en: 'Overall' },
        { dimension: 'physical',  score: scores.physical || 0,  benchmark: benchmark.physical || 70, prev_score: null, label_tr: 'Fiziksel', label_en: 'Physical' },
        { dimension: 'mental',    score: scores.mental || 0,    benchmark: benchmark.mental || 70, prev_score: null, label_tr: 'Zihinsel', label_en: 'Mental' },
        { dimension: 'social',    score: scores.social || 0,    benchmark: benchmark.social || 70, prev_score: null, label_tr: 'Sosyal', label_en: 'Social' },
        { dimension: 'financial', score: scores.financial || 0, benchmark: benchmark.financial || 70, prev_score: null, label_tr: 'Finansal', label_en: 'Financial' },
        { dimension: 'work',      score: scores.work || 0,      benchmark: benchmark.work || 70, prev_score: null, label_tr: 'İş & Anlam', label_en: 'Work & Purpose' },
      ];

      const mappedDepts = deptScores.map(ds => ({
        name: ds.department_name,
        score: ds.overall || 0,
        respondents: ds.respondents || 0
      }));

      const ai_content = insights.items.map(i => i.content).join('\n\n');

      // 2. HTML to PDF via Puppeteer
      const pdfBuffer = await this.reportHtmlHelper.generatePdf({
        company_name: company.name,
        company_industry: company.industry,
        period,
        language: language as 'tr' | 'en',
        brand_logo_url: settings.brand_logo_url || '',
        brand_name: settings.brand_name || 'WellAnalytics',
        consultant_name: consultant[0]?.full_name || 'WellAnalytics Support',
        consultant_logo_url: consultant[0]?.logo_url,
        is_white_label: !!consultant[0]?.logo_url,
        scores: mappedScores,
        departments: mappedDepts,
        ai_content: ai_content,
        total_respondents: parseInt(participationRes[0]?.total || '0'),
        response_rate: participationRate,
        risk_areas: mappedScores.filter(s => s.score < 50).map(s => s.dimension)
      });
      const s3Key = `reports/${companyId}/${period}/${jobId}.pdf`;
      
      const s3 = await this.getS3Client();
      await s3.send(new PutObjectCommand({
        Bucket: settings.storage_bucket || '',
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }));

      // 4. Audit Log
      if (requestedBy) {
        await this.auditService.logAction(requestedBy, companyId, 'report.generated', 'reports', jobId, { period, format: 'PDF', s3Key });
      }

      return s3Key;
    } catch (error) {
      this.logger.error(`PDF generation failed for job ${jobId}`, error);
      throw error;
    }
  }

  async generateExcel(companyId: string, period: string, language: string, jobId: string, requestedBy: string) {
    try {
      const workbook = new ExcelJS.Workbook();
      const companyRes = await this.dataSource.query(`SELECT name FROM companies WHERE id = $1`, [companyId]);
      const scores = await this.scoreService.getCompanyScore(companyId, period);
      const deptScores = await this.scoreService.getDepartmentScores(companyId, period);
      const trend = await this.scoreService.getTrend(companyId, 12);

      // Sheet 1: Summary
      const summarySheet = workbook.addWorksheet('Genel Özet');
      summarySheet.addRow(['Firma Adı', companyRes[0].name]);
      summarySheet.addRow(['Dönem', period]);
      summarySheet.addRow([]);
      summarySheet.addRow(['Boyut', 'Skor']);
      ['overall', 'physical', 'mental', 'social', 'financial', 'work'].forEach(dim => {
        summarySheet.addRow([dim.toUpperCase(), scores[dim] || 'N/A']);
      });

      // Sheet 2: Departments
      const deptSheet = workbook.addWorksheet('Departman Analizi');
      deptSheet.addRow(['Departman', 'Genel', 'Fiziksel', 'Zihinsel', 'Sosyal', 'Finansal', 'İş&Anlam']);
      deptScores.forEach(ds => {
        deptSheet.addRow([
          ds.department_name,
          ds.overall || 'N/A',
          ds.physical || 'N/A',
          ds.mental || 'N/A',
          ds.social || 'N/A',
          ds.financial || 'N/A',
          ds.work || 'N/A'
        ]);
      });

      // Upload to S3
      const buffer = await workbook.xlsx.writeBuffer();
      const settings = await this.settingsService.getSettings();
      const s3Key = `reports/${companyId}/${period}/${jobId}.xlsx`;
      
      const s3 = await this.getS3Client();
      await s3.send(new PutObjectCommand({
        Bucket: settings.storage_bucket || '',
        Key: s3Key,
        Body: buffer as unknown as Buffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));

      const signedUrl = await this.getSignedUrlInternal(s3Key);
      const userRes = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [requestedBy]);
      if (userRes.length) {
        await this.notificationService.sendEmail(userRes[0].email, 'report-ready', {
          url: signedUrl,
          period: PdfTemplateHelper.formatPeriod(period, language),
          format: 'Excel',
        });
      }

      await this.auditService.logAction(requestedBy, companyId, 'report.generated', 'reports', jobId, { format: 'excel', period, s3_key: s3Key });

    } catch (error) {
      this.logger.error(`Excel generation failed for job ${jobId}`, error);
      throw error;
    }
  }

  async generateIntelligencePdf(companyId: string, period: string, report: any, language: string) {
    this.logger.log(`Generating intelligence PDF for company ${companyId}, period ${period}`);
    
    try {
      const companyRes = await this.dataSource.query(`SELECT name, logo_url FROM companies WHERE id = $1`, [companyId]);
      const company = companyRes[0];
      
      const pdfBuffer = await this.reportHtmlHelper.generateIntelligencePdf(
        { name: company.name, logoUrl: company.logo_url },
        period,
        report,
        language
      );

      const settings = await this.settingsService.getSettings();
      const jobId = uuidv4();
      const s3Key = `intelligence_reports/${companyId}/${period}/${jobId}.pdf`;
      
      const s3 = await this.getS3Client();
      await s3.send(new PutObjectCommand({
        Bucket: settings.storage_bucket || '',
        Key: s3Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }));

      // Update AI Insight with S3 key
      await this.dataSource.query(
        `UPDATE ai_insights SET metadata = jsonb_set(metadata, '{pdf_s3_key}', $1) WHERE company_id = $2 AND period = $3 AND insight_type = 'intelligence_report'`,
        [JSON.stringify(s3Key), companyId, period]
      );

      return s3Key;
    } catch (error) {
      this.logger.error('Failed to generate intelligence PDF', error);
      throw error;
    }
  }

  private drawHeader(doc: any, title: string, language: string) {
    doc.fontSize(20).fillColor(ReportColors.NAVY).text(title);
    doc.moveDown();
    doc.strokeColor(ReportColors.GREEN).lineWidth(2).moveTo(doc.x, doc.y - 10).lineTo(doc.x + 50, doc.y - 10).stroke();
    doc.moveDown();
  }

  private async getSignedUrlInternal(s3Key: string): Promise<string> {
    const settings = await this.settingsService.getSettings();
    const s3 = await this.getS3Client();
    const command = new GetObjectCommand({
      Bucket: settings.storage_bucket || '',
      Key: s3Key,
    });
    return getSignedUrl(s3, command, { expiresIn: 900 });
  }

  async getSignedUrl(s3Key: string) {
    return this.getSignedUrlInternal(s3Key);
  }
}
