import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { WellbeingScore } from './entities/wellbeing-score.entity';
import { ScoreService } from './score.service';
import { ScoreProcessor } from './score.processor';
import { Company } from '../company/entities/company.entity';
import { User } from '../user/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WellbeingScore, Company, User]),
    BullModule.registerQueue({
      name: 'score-queue',
    }),
    NotificationModule,
  ],
  providers: [ScoreService, ScoreProcessor],
  exports: [ScoreService],
})
export class ScoreModule {}
