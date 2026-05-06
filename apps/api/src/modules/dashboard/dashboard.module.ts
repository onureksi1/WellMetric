import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { EmployeeDashboardService } from './employee-dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AiInsight } from '../ai/entities/ai-insight.entity';
import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { Survey } from '../survey/entities/survey.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { Employee } from '../user/entities/employee.entity';
import { ScoreModule } from '../score/score.module';
import { ResponseModule } from '../response/response.module';
import { BenchmarkModule } from '../benchmark/benchmark.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiInsight,
      SurveyAssignment,
      SurveyResponse,
      SurveyToken,
      Company,
      User,
      Survey,
      AuditLog,
      ContentItem,
      Employee,
    ]),
    forwardRef(() => ScoreModule),
    ResponseModule,
    BenchmarkModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    AdminDashboardService,
    EmployeeDashboardService,
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
