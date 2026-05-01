import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ReportService } from './report.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { DataSource } from 'typeorm';

export interface ReportJobData {
  companyId: string;
  requestedBy: string;
  period: string;
  format: 'pdf' | 'excel';
  language: string;
  jobId: string;
}

@Processor('report-queue')
export class ReportProcessor {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    private readonly reportService: ReportService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  @Process('generate')
  async handleGenerate(job: Job<ReportJobData>) {
    const { companyId, requestedBy, period, format, language, jobId } = job.data;
    this.logger.log(`Processing report generation job ${jobId} (${format}) for company ${companyId}`);

    try {
      if (format === 'pdf') {
        await this.reportService.generatePdf(companyId, period, language, jobId, requestedBy);
      } else {
        await this.reportService.generateExcel(companyId, period, language, jobId, requestedBy);
      }

      // Notify success
      const userRes = await this.dataSource.query(`SELECT email, full_name, company_id FROM users WHERE id = $1`, [requestedBy]);
      if (userRes.length) {
        const companyRes = await this.dataSource.query(`SELECT name FROM companies WHERE id = $1`, [userRes[0].company_id]);
        const companyName = companyRes[0]?.name || 'Şirketiniz';

        await this.notificationService.sendReportReady(
          userRes[0].email,
          userRes[0].full_name,
          companyName,
          period,
          format.toUpperCase(),
          `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reports`,
          language
        );
      }
    } catch (error) {
      this.logger.error(`Report generation failed for job ${jobId}: ${error.message}`, error.stack);
      
      if (job.attemptsMade >= 2) { // 3rd attempt failed (0, 1, 2)
        const userRes = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [requestedBy]);
        if (userRes.length) {
          await this.notificationService.sendEmail(userRes[0].email, 'report-failed', {
            period,
            format: format.toUpperCase(),
          });
        }
        await this.auditService.logAction(requestedBy, companyId, 'report.failed', 'reports', jobId, { error: error.message });
      }
      
      throw error; // Re-throw to trigger Bull retry
    }
  }
}
