import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultantService } from './consultant.service';
import { ConsultantController } from './consultant.controller';
import { AdminConsultantController } from './admin-consultant.controller';
import { ConsultantPlan } from './entities/consultant-plan.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { CompanyModule } from '../company/company.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { AIModule } from '../ai/ai.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultantPlan, Company, User]),
    forwardRef(() => CompanyModule),
    AuditModule,
    NotificationModule,
    AIModule,
    SettingsModule,
  ],
  controllers: [ConsultantController, AdminConsultantController],
  providers: [ConsultantService],
  exports: [ConsultantService],
})
export class ConsultantModule {}
