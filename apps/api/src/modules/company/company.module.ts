import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { Company } from './entities/company.entity';
import { Invitation } from '../auth/entities/invitation.entity';
import { IndustryModule } from '../industry/industry.module';
import { SettingsModule } from '../settings/settings.module';
import { DepartmentModule } from '../department/department.module';
import { SurveyModule } from '../survey/survey.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Invitation]),
    IndustryModule,
    SettingsModule,
    DepartmentModule,
    forwardRef(() => SurveyModule),
    AIModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
