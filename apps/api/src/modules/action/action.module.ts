import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionService } from './action.service';
import { ActionController } from './action.controller';
import { Action } from './entities/action.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { WellbeingScore } from '../score/entities/wellbeing-score.entity';
import { PlatformSettings } from '../settings/entities/platform-settings.entity';
import { AuditModule } from '../audit/audit.module';
import { ContentModule } from '../content/content.module';
import { ScoreModule } from '../score/score.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Action, ContentItem, WellbeingScore, PlatformSettings]),
    AuditModule,
    forwardRef(() => ContentModule),
    forwardRef(() => ScoreModule),
  ],
  controllers: [ActionController],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
