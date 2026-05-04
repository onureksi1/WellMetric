import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AdminUserController } from './admin-user.controller';
import { User } from './entities/user.entity';
import { Invitation } from '../auth/entities/invitation.entity';
import { Employee } from './entities/employee.entity';
import { SurveyToken } from '../survey-token/entities/survey-token.entity';
import { Company } from '../company/entities/company.entity';
import { Department } from '../department/entities/department.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { UploadModule } from '../upload/upload.module';

import { SurveyAssignment } from '../survey/entities/survey-assignment.entity';
import { SurveyResponse } from '../response/entities/survey-response.entity';
import { SurveyThrottle } from '../response/entities/survey-throttle.entity';
import { Survey } from '../survey/entities/survey.entity';


import { EmployeesService } from './employees.service';
import { EmployeeSurveyService } from './employee-survey.service';

import { HrEmployeesController } from './hr-employees.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Invitation,
      Employee,
      SurveyToken,
      Company,
      Department,
      SurveyAssignment,
      SurveyResponse,
      SurveyThrottle,
      Survey,
    ]),


    AuditModule,
    NotificationModule,
    UploadModule,
  ],

  controllers: [UserController, AdminUserController, HrEmployeesController],
  providers: [UserService, EmployeesService, EmployeeSurveyService],
  exports: [UserService, EmployeesService, EmployeeSurveyService],
})
export class UserModule {}
