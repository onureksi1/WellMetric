import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsultantPlan, 
      Company, 
      User, 
      Survey, 
      SurveyQuestion, 
      SurveyAssignment, 
      SurveyDraft
    ]),
    forwardRef(() => CompanyModule),
    SurveyModule,
    AuditModule,
    NotificationModule,
    AIModule,
    SettingsModule,
    BillingModule,
  ],
  controllers: [
    ConsultantController, 
    AdminConsultantController,
    ConsultantSurveysController,
    ConsultantAIController
  ],
  providers: [
    ConsultantService,
    ConsultantSurveysService,
    ConsultantSurveyOwnershipGuard
  ],
  exports: [ConsultantService, ConsultantSurveysService],
})
export class ConsultantModule {}
