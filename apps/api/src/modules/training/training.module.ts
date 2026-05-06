import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingPlan } from './entities/training-plan.entity';
import { TrainingEvent } from './entities/training-event.entity';
import { TrainingNotification } from './entities/training-notification.entity';
import { ContentEngagementLog } from './entities/content-engagement-log.entity';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { TrainingService } from './training.service';
import { ConsultantTrainingController } from './consultant-training.controller';
import { HrTrainingController } from './hr-training.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingPlan,
      TrainingEvent,
      TrainingNotification,
      ContentEngagementLog,
      Company,
      User,
      Department,
      ContentItem,
    ]),
    NotificationModule,
  ],
  providers: [TrainingService],
  controllers: [ConsultantTrainingController, HrTrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
