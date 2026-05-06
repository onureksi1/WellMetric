import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConsultantService } from './consultant.service';
import { ConsultantController } from './consultant.controller';
import { AdminConsultantController } from './admin-consultant.controller';
import { ConsultantPlan } from './entities/consultant-plan.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { Survey } from '../survey/entities/survey.entity';
import { SurveyQuestion } from '../survey/entities/survey-question.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyDraft } from '../survey/entities/survey-draft.entity';
import { CompanyModule } from '../company/company.module';
import { SurveyModule } from '../survey/survey.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { AIModule } from '../ai/ai.module';
import { SettingsModule } from '../settings/settings.module';
import { ConsultantSurveysController } from './consultant-surveys.controller';
import { ConsultantSurveysService } from './consultant-surveys.service';
import { ConsultantSurveyOwnershipGuard } from '../../common/guards/consultant-survey-ownership.guard';
import { ConsultantAIController } from './consultant-ai.controller';
import { BillingModule } from '../billing/billing.module';
import { ConsultantContentController } from './consultant-content.controller';
import { ConsultantContentService } from './consultant-content.service';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentAssignment } from '../content/entities/content-assignment.entity';
import { Department } from '../department/entities/department.entity';
import { ConsultantReport } from './entities/consultant-report.entity';
import { AiInsight } from '../ai/entities/ai-insight.entity';
import { ConsultantReportsService } from './consultant-reports.service';
import { ConsultantReportsController } from './consultant-reports.controller';
import { HrConsultantReportsController } from './hr-consultant-reports.controller';
import { ReportModule } from '../report/report.module';
import { DepartmentModule } from '../department/department.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultantPlan, 
      Company, 
      User, 
      Survey, 
      SurveyQuestion, 
      SurveyAssignment, 
      SurveyDraft,
      ContentItem,
      ContentAssignment,
      Department,
      ConsultantReport,
      AiInsight
    ]),
    forwardRef(() => CompanyModule),
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
    SurveyModule,
    AuditModule,
    NotificationModule,
    AIModule,
    SettingsModule,
    BillingModule,
    ReportModule,
    DepartmentModule,
  ],
  controllers: [
    ConsultantController, 
    AdminConsultantController,
    ConsultantSurveysController,
    ConsultantAIController,
    ConsultantContentController,
    ConsultantReportsController,
    HrConsultantReportsController
  ],
  providers: [
    ConsultantService,
    ConsultantSurveysService,
    ConsultantSurveyOwnershipGuard,
    ConsultantContentService,
    ConsultantReportsService
  ],
  exports: [ConsultantService, ConsultantSurveysService, ConsultantContentService, ConsultantReportsService],
})
export class ConsultantModule {}
