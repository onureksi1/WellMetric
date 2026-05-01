import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { MailProviderFactory } from './providers/mail-provider.factory';
import { ResendProvider } from './providers/resend.provider';
import { SendGridProvider } from './providers/sendgrid.provider';
import { AwsSesProvider } from './providers/aws-ses.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { LoggerProvider } from './providers/logger.provider';
import { TemplateHelper } from './helpers/template.helper';
import { SettingsModule } from '../settings/settings.module';
import { AuditModule } from '../audit/audit.module';
import { BillingModule } from '../billing/billing.module';
import { MailTemplate } from './entities/mail-template.entity';
import { MailTemplateService } from './mail-template.service';
import { MailTemplateController } from './mail-template.controller';
import { NotificationController } from './notification.controller';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
    TypeOrmModule.forFeature([MailTemplate]),
    SettingsModule,
    AuditModule,
    BillingModule,
  ],
  controllers: [MailTemplateController, NotificationController],
  providers: [
    NotificationService,
    NotificationProcessor,
    MailProviderFactory,
    TemplateHelper,
    MailTemplateService,
  ],
  exports: [NotificationService, MailTemplateService],
})
export class NotificationModule {}
