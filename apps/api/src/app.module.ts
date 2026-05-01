import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';



import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { DepartmentModule } from './modules/department/department.module';
import { UserModule } from './modules/user/user.module';
import { SurveyModule } from './modules/survey/survey.module';
import { SurveyTokenModule } from './modules/survey-token/survey-token.module';
import { ResponseModule } from './modules/response/response.module';
import { ScoreModule } from './modules/score/score.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ActionModule } from './modules/action/action.module';
import { ContentModule } from './modules/content/content.module';
import { AIModule } from './modules/ai/ai.module';
import { ReportModule } from './modules/report/report.module';
import { NotificationModule } from './modules/notification/notification.module';
import { UploadModule } from './modules/upload/upload.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CronModule } from './modules/cron/cron.module';
import { AuditModule } from './modules/audit/audit.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { IndustryModule } from './modules/industry/industry.module';
import { DemoModule } from './modules/demo/demo.module';
import { ConsultantModule } from './modules/consultant/consultant.module';
import { BillingModule } from './modules/billing/billing.module';
import { SeedService } from './database/seed.service';

import { User } from './modules/user/entities/user.entity';
import { PlatformSettings } from './modules/settings/entities/platform-settings.entity';
import { HealthController } from './common/controllers/health.controller';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),


    // ── PostgreSQL via TypeORM ────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // ── Redis / BullMQ ───────────────────────────────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // ── Rate Limiting ────────────────────────────────────────────────
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),


    // ── Feature Modules ──────────────────────────────────────────────
    AuthModule,
    CompanyModule,
    DepartmentModule,
    UserModule,
    SurveyModule,
    SurveyTokenModule,
    ResponseModule,
    ScoreModule,
    DashboardModule,
    ActionModule,
    ContentModule,
    AIModule,
    ReportModule,
    NotificationModule,
    UploadModule,
    SettingsModule,
    CronModule,
    AuditModule,
    CampaignModule,
    IndustryModule,
    DemoModule,
    ConsultantModule,
    BillingModule,
    TypeOrmModule.forFeature([User, PlatformSettings]),

  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
