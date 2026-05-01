import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentItem } from './entities/content-item.entity';
import { Action } from '../action/entities/action.entity';
import { ScoreModule } from '../score/score.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentItem, Action]),
    AuditModule,
    forwardRef(() => ScoreModule),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
