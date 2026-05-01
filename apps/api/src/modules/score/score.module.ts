import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { WellbeingScore } from './entities/wellbeing-score.entity';
import { ScoreService } from './score.service';
import { ScoreProcessor } from './score.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([WellbeingScore]),
    BullModule.registerQueue({
      name: 'score-queue',
    }),
  ],
  providers: [ScoreService, ScoreProcessor],
  exports: [ScoreService],
})
export class ScoreModule {}
