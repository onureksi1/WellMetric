import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { DemoRequest } from './entities/demo.entity';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DemoRequest]),
    NotificationModule,
    AuditModule,
    SettingsModule,
  ],

  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
