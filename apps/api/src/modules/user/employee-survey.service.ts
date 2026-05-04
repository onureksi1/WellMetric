import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Employee } from '../user/entities/employee.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { NotificationService } from '../notification/notification.service';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class EmployeeSurveyService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(SurveyToken)
    private readonly tokenRepo: Repository<SurveyToken>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    @InjectRepository(SurveyAssignment)
    private readonly assignmentRepo: Repository<SurveyAssignment>,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
  ) {}

  async sendSurveyToAll(
    companyId: string,
    surveyId: string,
    period: string,
  ): Promise<{ sent: number; skipped: number }> {
    this.logger.info('Anket gönderimi başladı', { service: 'EmployeeSurveyService' }, {
      companyId, surveyId, period
    });

    const employees = await this.employeeRepo.find({
      where: { companyId, isActive: true }
    });

    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Anket bulunamadı');

    let sent    = 0;
    let skipped = 0;

    for (const employee of employees) {
      try {
        const existing = await this.tokenRepo.findOne({
          where: {
            employee_id: employee.id,
            survey_id:   surveyId,
          }
        });

        if (existing && !existing.is_used && existing.expires_at! > new Date()) {
          skipped++;
          continue;
        }

        await this.sendToEmployee(employee, survey, period);
        sent++;

      } catch (err) {
        this.logger.error('Tek çalışana gönderim hatası', {
          service: 'EmployeeSurveyService',
          userId:  employee.id,
        }, err);
        skipped++;
      }
    }

    await this.assignmentRepo.update(
      { survey_id: surveyId, company_id: companyId, period },
      { status: 'sent', assigned_at: new Date() }
    );

    return { sent, skipped };
  }

  async sendToEmployee(
    employee: Employee,
    survey: Survey,
    period: string,
  ): Promise<void> {
    const token = crypto.randomBytes(48).toString('hex');

    await this.tokenRepo.save({
      token,
      survey_id:   survey.id,
      company_id:  employee.companyId,
      employee_id: employee.id,
      email:       employee.email,
      full_name:   employee.fullName,
      language:    'tr',
      expires_at:  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      is_used:     false,
    });

    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/survey/${token}`;

    await this.notificationService.sendEmail(
      employee.email,
      'survey_invitation',
      {
        full_name:   employee.fullName,
        survey_name: survey.title_tr,
        survey_url:  surveyUrl,
        expires_in:  '14 gün',
        period,
      },
    );

    this.logger.debug('Token ve mail gönderildi', { service: 'EmployeeSurveyService' }, {
      email: employee.email, token: token.slice(0, 8) + '...'
    });
  }

  async sendToSingle(
    employeeId: string,
    surveyId: string,
    companyId: string,
    period: string,
  ): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, companyId: companyId }
    });
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');

    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Anket bulunamadı');

    await this.sendToEmployee(employee, survey, period);
  }
}
