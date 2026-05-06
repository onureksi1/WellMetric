
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NotificationService } from './modules/notification/notification.service';
import { MailTemplateService } from './modules/notification/mail-template.service';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationService = app.get(NotificationService);
  const mailTemplateService = app.get(MailTemplateService);

  const to = 'onur@3bitz.com';
  const slug = 'consultant_report_ready';
  const variables = {
    consultant_name: 'Onur Ekşi',
    company_name: 'Test Firması',
    period: 'Mayıs 2026',
    report_url: 'https://app.wellanalytics.io/reports/test',
    platform_url: 'https://app.wellanalytics.io',
    brand_logo_url: 'https://app.wellanalytics.io/images/logo.png',
    brand_name: 'Wellbeing Metric'
  };

  console.log(`Rendering ${slug}...`);
  const rendered = await mailTemplateService.render(slug, 'tr', variables);
  
  fs.writeFileSync('rendered_mail.html', rendered);
  console.log('Rendered body saved to rendered_mail.html (Length: ' + rendered.length + ')');

  console.log(`Sending test email to ${to}...`);
  await notificationService.sendEmail(to, slug, variables);
  console.log('Sent.');

  await app.close();
}

bootstrap();
