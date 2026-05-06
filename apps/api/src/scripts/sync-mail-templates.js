const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db';

const templateDirTr = '/Users/onureksi/Desktop/wellanalytics/apps/api/src/modules/notification/templates/tr';
const templateDirEn = '/Users/onureksi/Desktop/wellanalytics/apps/api/src/modules/notification/templates/en';

const subjectsTr = {
  ai_ready: '🤖 AI Analizi Hazır',
  campaign_bounced: '⚠️ Teslim Edilemeyen Mailler',
  campaign_invite: '📋 Wellbeing Anketi Daveti',
  campaign_reminder: '⏰ Hatırlatma: Anketinizi Tamamlayın',
  draft_reminder: '📝 Yarım Kalan Anketiniz Sizi Bekliyor',
  employee_invite: 'Wellbeing Hesabınızı Oluşturun',
  password_reset: 'Şifre Sıfırlama Talebi',
  plan_expiry: '⚠️ Aboneliğiniz Sona Ermek Üzere',
  report_failed: '❌ Rapor Oluşturulamadı',
  report_ready: '📑 Raporunuz İndirilmeye Hazır',
  score_alert: '⚠️ Düşük Wellbeing Skoru Uyarısı',
  survey_closed: '📊 Wellbeing Sonuçları Hazır',
  survey_reminder: '⏰ Anketinizi Tamamlamayı Unutmayın',
  survey_token_invite: '🌱 Wellbeing Anketiniz Hazır',
  welcome_hr: 'Wellbeing Platformuna Hoş Geldiniz'
};

const subjectsEn = {
  ai_ready: '🤖 AI Analysis Ready',
  campaign_bounced: '⚠️ Undelivered Emails',
  campaign_invite: '📋 Wellbeing Survey Invitation',
  campaign_reminder: '⏰ Reminder: Complete Your Survey',
  draft_reminder: '📝 Your Incomplete Survey is Waiting',
  employee_invite: 'Create Your Wellbeing Account',
  password_reset: 'Password Reset Request',
  plan_expiry: '⚠️ Your Subscription is About to Expire',
  report_failed: '❌ Report Generation Failed',
  report_ready: '📑 Your Report is Ready for Download',
  score_alert: '⚠️ Low Wellbeing Score Alert',
  survey_closed: '📊 Wellbeing Results are Ready',
  survey_reminder: "⏰ Don't Forget to Complete Your Survey",
  survey_token_invite: '🌱 Your Wellbeing Survey is Ready',
  welcome_hr: 'Welcome to Wellbeing Platform'
};

const variablesMap = {
  ai_ready: ['hr_name', 'company_name', 'period', 'dashboard_link'],
  campaign_bounced: ['hr_name', 'company_name', 'bounced_count', 'dashboard_link'],
  campaign_invite: ['full_name', 'company_name', 'survey_title', 'survey_link', 'due_date'],
  campaign_reminder: ['full_name', 'company_name', 'survey_title', 'survey_link', 'days_remaining'],
  draft_reminder: ['full_name', 'survey_title', 'survey_link', 'due_date'],
  employee_invite: ['full_name', 'company_name', 'invite_link', 'expires_in'],
  password_reset: ['user_name', 'reset_link', 'expires_in'],
  plan_expiry: ['company_name', 'days_remaining', 'plan_name'],
  report_failed: ['hr_name', 'company_name', 'period', 'format', 'support_email'],
  report_ready: ['hr_name', 'company_name', 'period', 'format', 'download_link', 'expires_in'],
  score_alert: ['hr_name', 'company_name', 'dimension', 'score', 'previous_score', 'dashboard_link'],
  survey_closed: ['hr_name', 'company_name', 'period', 'participation_rate', 'dashboard_link'],
  survey_reminder: ['full_name', 'survey_title', 'survey_link', 'days_remaining'],
  survey_token_invite: ['full_name', 'company_name', 'survey_title', 'survey_link', 'due_date'],
  welcome_hr: ['hr_name', 'company_name', 'invite_link', 'platform_url']
};

async function sync() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to DB');

  const files = fs.readdirSync(templateDirTr).filter(f => f.endsWith('.html'));

  for (const file of files) {
    const slug = file.replace('.html', '');
    const bodyTr = fs.readFileSync(path.join(templateDirTr, file), 'utf8');
    const bodyEn = fs.existsSync(path.join(templateDirEn, file)) 
      ? fs.readFileSync(path.join(templateDirEn, file), 'utf8') 
      : null;

    const subjectTr = subjectsTr[slug] || 'Wellbeing Platform Bildirimi';
    const subjectEn = subjectsEn[slug] || null;
    const variables = variablesMap[slug] || [];

    const res = await client.query('SELECT id FROM mail_templates WHERE slug = $1', [slug]);
    
    if (res.rows.length > 0) {
      console.log(`Updating template: ${slug}`);
      await client.query(
        'UPDATE mail_templates SET subject_tr = $1, subject_en = $2, body_tr = $3, body_en = $4, variables = $5, updated_at = NOW() WHERE slug = $6',
        [subjectTr, subjectEn, bodyTr, bodyEn, JSON.stringify(variables.map(v => `{{${v}}}`)), slug]
      );
    } else {
      console.log(`Inserting template: ${slug}`);
      await client.query(
        'INSERT INTO mail_templates (slug, subject_tr, subject_en, body_tr, body_en, variables) VALUES ($1, $2, $3, $4, $5, $6)',
        [slug, subjectTr, subjectEn, bodyTr, bodyEn, JSON.stringify(variables.map(v => `{{${v}}}`))]
      );
    }
  }

  await client.end();
  console.log('Sync completed');
}

sync().catch(console.error);
