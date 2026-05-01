import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { AIService } from './ai.service';
import { NotificationService } from '../notification/notification.service';
import { ScoreService } from '../score/score.service';
import { DataSource } from 'typeorm';

@Processor('ai-queue')
export class AIProcessor {
  private readonly logger = new Logger(AIProcessor.name);

  constructor(
    private readonly aiService: AIService,
    private readonly notificationService: NotificationService,
    private readonly scoreService: ScoreService,
    private readonly dataSource: DataSource,
  ) {}

  @Process('open_text_summary')
  async handleOpenTextSummary(job: Job) {
    const { companyId, surveyId, period, language } = job.data;
    this.logger.log(`Processing open_text_summary for company ${companyId}, survey ${surveyId}`);
    
    try {
      await this.aiService.generateOpenTextSummary(companyId, surveyId, period, language);
      
      // Get HR Admins of the company
      const hrAdmins = await this.dataSource.query(
        `SELECT email FROM users WHERE company_id = $1 AND role = 'hr_admin'`,
        [companyId]
      );

      for (const admin of hrAdmins) {
        await this.notificationService.sendEmail(admin.email, 'ai-analysis-ready', {
          period,
          surveyId
        });
      }
    } catch (error) {
      this.logger.error(`Error in open_text_summary job: ${error.message}`, error.stack);
      throw error; // Trigger retry
    }
  }

  @Process('risk_alert')
  async handleRiskAlert(job: Job) {
    const { companyId, departmentId, dimension, score, previousScore, period } = job.data;
    this.logger.log(`Processing risk_alert for company ${companyId}, dimension ${dimension}`);

    try {
      await this.aiService.generateRiskAlert(companyId, departmentId, dimension, score, previousScore, period);
      
      const hrAdmins = await this.dataSource.query(
        `SELECT email FROM users WHERE company_id = $1 AND role = 'hr_admin'`,
        [companyId]
      );

      for (const admin of hrAdmins) {
        await this.notificationService.sendEmail(admin.email, 'low-score-alert', {
          dimension,
          score,
          period
        });
      }
    } catch (error) {
      this.logger.error(`Error in risk_alert job: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('trend_analysis')
  async handleTrendAnalysis(job: Job) {
    const { companyId, period, language } = job.data;
    this.logger.log(`Processing trend_analysis for company ${companyId}`);

    try {
      await this.aiService.generateTrendAnalysis(companyId, period, language);
    } catch (error) {
      this.logger.error(`Error in trend_analysis job: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('admin_anomaly')
  async handleAdminAnomaly(job: Job) {
    const { period, language } = job.data;
    this.logger.log(`Processing admin_anomaly for period ${period}`);

    try {
      await this.aiService.adminAnomaly(period, language);
    } catch (error) {
      this.logger.error(`Error in admin_anomaly job: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('intelligence_report')
  async handleIntelligenceReport(job: Job) {
    const { companyId, period, language } = job.data;
    this.logger.log(`Processing intelligence_report for company ${companyId}, period ${period}`);

    try {
      await this.aiService.generateIntelligenceReport(companyId, period, language);
      
      const hrAdmins = await this.dataSource.query(
        `SELECT email FROM users WHERE company_id = $1 AND role = 'hr_admin'`,
        [companyId]
      );

      for (const admin of hrAdmins) {
        await this.notificationService.sendEmail(admin.email, 'intelligence-report-ready', {
          period
        });
      }
    } catch (error) {
      this.logger.error(`Error in intelligence_report job: ${error.message}`, error.stack);
      throw error;
    }
  }
}
