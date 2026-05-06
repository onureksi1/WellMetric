import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndustryBenchmarkScore } from './benchmark.entity';
import { BenchmarkService } from './benchmark.service';
import { BenchmarkController } from './benchmark.controller';
import { WellbeingScore } from '../score/entities/wellbeing-score.entity';
import { Company } from '../company/entities/company.entity';

import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([IndustryBenchmarkScore, WellbeingScore, Company]),
    AIModule,
  ],
  controllers: [BenchmarkController],
  providers: [BenchmarkService],
  exports: [BenchmarkService],
})
export class BenchmarkModule {}
