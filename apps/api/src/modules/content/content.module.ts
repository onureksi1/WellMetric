import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ContentItem } from './entities/content-item.entity';
import { ContentAssignment } from './entities/content-assignment.entity';
import { HrContentController } from './hr-content.controller';
import { HrContentService } from './hr-content.service';
import { Action } from '../action/entities/action.entity';
import { ScoreModule } from '../score/score.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentItem, ContentAssignment, Action, User]),
    AuditModule,
    NotificationModule,
    forwardRef(() => ScoreModule),
  ],
  controllers: [ContentController, HrContentController],
  providers: [ContentService, HrContentService],
  exports: [ContentService, HrContentService, TypeOrmModule],
})
export class ContentModule {}
