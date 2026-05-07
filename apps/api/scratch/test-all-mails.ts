import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { NotificationService } from '../src/modules/notification/notification.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationService = app.get(NotificationService);
  const to = 'onur@3bitz.com';

  const testData = {
    consultant_invite: { full_name: 'Onur Ekşi', invite_link: 'https://wellmetric.io/invite?token=test', expires_in: '48 saat' },
    password_reset: { user_name: 'Onur Ekşi', reset_link: 'https://wellmetric.io/reset?token=test', expires_in: '1 saat' },
    welcome_hr: { hr_name: 'Onur HR', company_name: '3Bitz Tech', platform_url: 'https://wellmetric.io', invite_link: 'https://wellmetric.io/hr-invite' },
    campaign_bounced: { hr_name: 'Onur HR', company_name: '3Bitz Tech', bounced_count: '5', dashboard_link: 'https://wellmetric.io/dashboard' },
    campaign_invite: { full_name: 'Onur Çalışan', company_name: '3Bitz Tech', survey_title: 'Yıllık Esenlik Anketi', survey_link: 'https://wellmetric.io/s/test', due_date: '31.12.2026' },
    campaign_reminder: { full_name: 'Onur Çalışan', company_name: '3Bitz Tech', survey_title: 'Yıllık Esenlik Anketi', survey_link: 'https://wellmetric.io/s/test', days_remaining: '3' },
    draft_reminder: { full_name: 'Onur Çalışan', survey_title: 'Yıllık Esenlik Anketi', survey_link: 'https://wellmetric.io/s/test', due_date: '31.12.2026' },
    plan_expiry: { company_name: '3Bitz Tech', days_remaining: '7', plan_name: 'Growth Plan', contact_email: 'onur@3bitz.com' },
    report_ready: { hr_name: 'Onur HR', company_name: '3Bitz Tech', period: 'Ocak 2026', format: 'PDF', download_link: 'https://wellmetric.io/download/test', expires_in: '15 dakika' },
    score_alert: { hr_name: 'Onur HR', company_name: '3Bitz Tech', dimension: 'Psikolojik Güvenlik', score: '35', previous_score: '65', dashboard_link: 'https://wellmetric.io/dashboard' },
    ai_ready: { hr_name: 'Onur HR', company_name: '3Bitz Tech', period: 'Ocak 2026', dashboard_link: 'https://wellmetric.io/dashboard' },
    employee_invite: { full_name: 'Onur Çalışan', company_name: '3Bitz Tech', invite_link: 'https://wellmetric.io/invite?token=test', expires_in: '72 saat' },
    survey_reminder: { full_name: 'Onur Çalışan', survey_title: 'Yıllık Esenlik Anketi', survey_link: 'https://wellmetric.io/s/test', days_remaining: '2' },
    survey_token_invite: { full_name: 'Onur Çalışan', company_name: '3Bitz Tech', survey_title: 'Esenlik Anketi', survey_link: 'https://wellmetric.io/s/test', due_date: '31.12.2026', estimated_minutes: '5' },
    report_failed: { hr_name: 'Onur HR', company_name: '3Bitz Tech', period: 'Ocak 2026', format: 'Excel', support_email: 'destek@wellmetric.io' },
    survey_closed: { hr_name: 'Onur HR', company_name: '3Bitz Tech', period: 'Ocak 2026', dashboard_link: 'https://wellmetric.io/dashboard', participation_rate: '85' },
    content_shared: { full_name: 'Onur Çalışan', content_title: 'Meditasyon Teknikleri', content_link: 'https://wellmetric.io/content/1' },
    training_plan_published: { hr_name: 'Onur HR', plan_name: 'Liderlik Eğitimi', plan_link: 'https://wellmetric.io/training/1' },
    content_shared_to_employees: { company_name: '3Bitz Tech', content_title: 'Stres Yönetimi', content_link: 'https://wellmetric.io/content/2' },
    consultant_report_ready: { full_name: 'Onur Ekşi', report_name: 'Çeyrek Analizi', download_link: 'https://wellmetric.io/download/consultant/1' }
  };

  console.log('--- Starting All-Template Mail Test ---');

  for (const [slug, vars] of Object.entries(testData)) {
    console.log(`Sending: ${slug}...`);
    try {
      await (notificationService as any).addToQueue(slug, to, `TEST: ${slug}`, vars, 'tr');
    } catch (err) {
      console.error(`FAILED ${slug}:`, err.message);
    }
  }

  console.log('--- All jobs added to queue. Please check Resend dashboard. ---');
  await app.close();
}

bootstrap();
