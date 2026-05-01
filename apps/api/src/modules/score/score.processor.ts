import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { ScoreService } from './score.service';
import { NotificationService } from '../notification/notification.service';
import { DataSource } from 'typeorm';

@Processor('score-queue')
export class ScoreProcessor {
  private readonly logger = new Logger(ScoreProcessor.name);

  constructor(
    private readonly scoreService: ScoreService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
  ) {}

  @Process('recalculate_scores')
  async handleRecalculateScores(job: Job<{ company_id: string; survey_id: string; period: string }>) {
    this.logger.debug(`Processing recalculate_scores for company ${job.data.company_id}, survey ${job.data.survey_id}`);
    try {
      await this.scoreService.calculateAndStore(job.data.company_id, job.data.survey_id, job.data.period);
      this.logger.debug(`Successfully recalculated scores for ${job.data.company_id}`);
    } catch (error) {
      this.logger.error(`Error recalculating scores for ${job.data.company_id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('risk_alert')
  async handleRiskAlert(job: Job<{ company_id: string; department_id?: string; dimension: string; score: number; type: 'overall' | 'department' }>) {
    this.logger.warn(`RISK ALERT triggered for ${job.data.company_id}: Score ${job.data.score} in dimension ${job.data.dimension}`);
    
    try {
      const { company_id, department_id, dimension, score } = job.data;
      
      // Fetch HR Admins
      const admins = await this.dataSource.query(
        `SELECT email, full_name, language FROM users WHERE company_id = $1 AND role = 'hr_admin' AND is_active = true`,
        [company_id]
      );

      const company = (await this.dataSource.query(`SELECT name FROM companies WHERE id = $1`, [company_id]))[0];
      const deptName = department_id ? (await this.dataSource.query(`SELECT name FROM departments WHERE id = $1`, [department_id]))[0]?.name : 'Şirket Geneli';

      for (const admin of admins) {
        await this.notificationService.sendScoreAlert(
          admin.email,
          admin.full_name,
          company?.name || 'Şirket',
          dimension,
          score,
          null, // previousScore placeholder
          admin.language || 'tr'
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process risk alert: ${error.message}`);
    }
  }
}
