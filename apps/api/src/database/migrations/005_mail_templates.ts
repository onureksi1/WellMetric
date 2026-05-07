import { MigrationInterface, QueryRunner } from 'typeorm';

export class MailTemplates1746050400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("CREATE TABLE mail_templates (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), slug VARCHAR(50) UNIQUE NOT NULL, subject_tr VARCHAR(300) NOT NULL, subject_en VARCHAR(300), body_tr TEXT NOT NULL, body_en TEXT, variables JSONB NOT NULL DEFAULT '[]', description TEXT, is_active BOOLEAN DEFAULT true, updated_at TIMESTAMPTZ DEFAULT NOW(), updated_by UUID REFERENCES users(id))");

    const getBaseHtml = (title: string, content: string, ctaLabel?: string, ctaLink?: string) => {
      let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: \'Inter\', -apple-system, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; } .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); } .header { background: #2E865A; padding: 40px 32px; text-align: center; color: #ffffff; } .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; } .content { padding: 40px 32px; } .content h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; } .content p { margin: 16px 0; font-size: 16px; color: #475569; } .cta-container { margin: 32px 0; text-align: center; } .cta-button { background-color: #2E865A; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block; transition: all 0.2s; } .footer { background: #f8fafc; padding: 32px; text-align: center; border-top: 1px solid #f1f5f9; } .footer p { margin: 4px 0; font-size: 13px; color: #94a3b8; } .footer a { color: #2E865A; text-decoration: none; font-weight: 600; } .logo-bottom { text-align: center; padding: 20px 0; border-top: 1px solid #f1f5f9; } .logo-bottom h1 { color: #2E865A; margin: 0; font-size: 20px; font-weight: 800; }</style></head><body><div class="wrapper"><div class="header"><h1>Wellbeing Metric</h1></div><div class="content"><h2>' + title + '</h2>' + content;
      if (ctaLabel && ctaLink) {
        html += '<div class="cta-container"><a href="' + ctaLink + '" class="cta-button">' + ctaLabel + '</a></div>';
      }
      html += '</div><div class="logo-bottom"><h1>🌱 Wellbeing Metric</h1></div><div class="footer"><p>Sorularınız için <a href="mailto:destek@wellbeingmetric.com">destek@wellbeingmetric.com</a> adresinden bize ulaşabilirsiniz.</p></div></div></body></html>';
      return html;
    };

    const templates = [
      {
        slug: 'welcome_hr',
        subject_tr: 'Wellbeing Metric Hoş Geldiniz',
        subject_en: 'Welcome to Wellbeing Metric',
        variables: ['{{hr_name}}', '{{company_name}}', '{{invite_link}}'],
        body_tr: getBaseHtml('Hoş Geldin, {{hr_name}}!', '<p>{{company_name}} için HR Admin olarak davet edildiniz. Hesabınızı oluşturarak şirketinizin wellbeing yolculuğunu başlatabilirsiniz.</p>', 'Hesabımı Oluştur →', '{{invite_link}}'),
        body_en: getBaseHtml('Welcome, {{hr_name}}!', "<p>You have been invited as an HR Admin for {{company_name}}. Create your account to start your company's wellbeing journey.</p>", 'Create My Account →', '{{invite_link}}'),
        description: 'HR Admin davet mesajı'
      },
      {
        slug: 'password_reset',
        subject_tr: 'Şifre Sıfırlama Talebi',
        subject_en: 'Password Reset Request',
        variables: ['{{user_name}}', '{{reset_link}}', '{{expires_in}}'],
        body_tr: getBaseHtml('Şifrenizi mi Unuttunuz?', '<p>Merhaba {{user_name}}, şifrenizi sıfırlamak için aşağıdaki butonu kullanabilirsiniz. Bu link {{expires_in}} boyunca geçerlidir.</p>', 'Şifremi Sıfırla', '{{reset_link}}'),
        body_en: getBaseHtml('Forgot Your Password?', '<p>Hello {{user_name}}, use the button below to reset your password. This link is valid for {{expires_in}}.</p>', 'Reset Password', '{{reset_link}}'),
        description: 'Şifre sıfırlama linki'
      },
      {
        slug: 'survey_token_invite',
        subject_tr: '🌱 Wellbeing Anketiniz Hazır',
        subject_en: '🌱 Your Wellbeing Survey is Ready',
        variables: ['{{full_name}}', '{{company_name}}', '{{survey_title}}', '{{survey_link}}', '{{due_date}}'],
        body_tr: getBaseHtml('Anketiniz Sizi Bekliyor!', '<p>Merhaba {{full_name}}, {{company_name}} tarafından düzenlenen <b>{{survey_title}}</b> anketi için katılımınız bekleniyor. Görüşleriniz tamamen anonimdir.</p><p>Son katılım: {{due_date}}</p>', 'Ankete Başla →', '{{survey_link}}'),
        body_en: getBaseHtml('Your Survey is Waiting!', '<p>Hello {{full_name}}, your participation is requested for the <b>{{survey_title}}</b> survey organized by {{company_name}}. Your feedback is completely anonymous.</p><p>Due date: {{due_date}}</p>', 'Start Survey →', '{{survey_link}}'),
        description: 'Bireysel anket davetiyesi'
      },
      {
        slug: 'employee_invite',
        subject_tr: 'Wellbeing Hesabınızı Oluşturun',
        subject_en: 'Create Your Wellbeing Account',
        variables: ['{{full_name}}', '{{company_name}}', '{{invite_link}}'],
        body_tr: getBaseHtml('Ekibimize Hoş Geldiniz!', '<p>Merhaba {{full_name}}, {{company_name}} wellbeing metric erişiminiz tanımlandı. Aşağıdaki butona tıklayarak kaydınızı tamamlayabilirsiniz.</p>', 'Kayıt Ol', '{{invite_link}}'),
        body_en: getBaseHtml('Welcome to the Team!', '<p>Hello {{full_name}}, your access to the {{company_name}} wellbeing metric has been defined. Click the button below to complete your registration.</p>', 'Sign Up', '{{invite_link}}'),
        description: 'Çalışan kayıt davetiyesi'
      },
      {
        slug: 'campaign_invite',
        subject_tr: '📋 Yeni Bir Araştırma Başladı',
        subject_en: '📋 A New Research Has Started',
        variables: ['{{full_name}}', '{{company_name}}', '{{survey_title}}', '{{survey_link}}'],
        body_tr: getBaseHtml('Görüşleriniz Bizim İçin Önemli', '<p>Merhaba {{full_name}}, şirketimizde <b>{{survey_title}}</b> araştırması başladı. Lütfen linke tıklayarak katılım sağlayın.</p>', 'Katıl', '{{survey_link}}'),
        body_en: getBaseHtml('Your Feedback is Important', '<p>Hello {{full_name}}, the <b>{{survey_title}}</b> research has started in our company. Please click the link to participate.</p>', 'Participate', '{{survey_link}}'),
        description: 'Kampanya bazlı anket daveti'
      },
      {
        slug: 'campaign_reminder',
        subject_tr: '⏰ Hatırlatma: Anketinizi Tamamlayın',
        subject_en: '⏰ Reminder: Complete Your Survey',
        variables: ['{{full_name}}', '{{survey_title}}', '{{survey_link}}', '{{days_remaining}}'],
        body_tr: getBaseHtml('Az Kaldı!', '<p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketini tamamlamanız için son {{days_remaining}} gün. Henüz vaktiniz varken görüşlerinizi bildirmeyi unutmayın.</p>', 'Anketi Tamamla', '{{survey_link}}'),
        body_en: getBaseHtml('Almost There!', "<p>Hello {{full_name}}, there are only {{days_remaining}} days left to complete the <b>{{survey_title}}</b> survey. Don't forget to submit your feedback while you still have time.</p>", 'Complete Survey', '{{survey_link}}'),
        description: 'Kampanya hatırlatma mesajı'
      },
      {
        slug: 'survey_reminder',
        subject_tr: '⏰ Anketinizi Tamamlamayı Unutmayın',
        subject_en: "⏰ Don't Forget to Complete Your Survey",
        variables: ['{{full_name}}', '{{survey_title}}', '{{survey_link}}', '{{days_remaining}}'],
        body_tr: getBaseHtml('Görüşleriniz Değerlidir', '<p>Merhaba {{full_name}}, devam eden <b>{{survey_title}}</b> anketiniz için son {{days_remaining}} gün. Katılımınız için şimdiden teşekkürler.</p>', 'Hemen Tamamla', '{{survey_link}}'),
        body_en: getBaseHtml('Your Opinion Matters', "<p>Hello {{full_name}}, there are {{days_remaining}} days left for your ongoing <b>{{survey_title}}</b> survey. Thank you for your participation.</p>", 'Complete Now', '{{survey_link}}'),
        description: 'Genel anket hatırlatması'
      },
      {
        slug: 'survey_closed',
        subject_tr: '📊 Wellbeing Sonuçları Hazır',
        subject_en: '📊 Wellbeing Results are Ready',
        variables: ['{{hr_name}}', '{{company_name}}', '{{period}}', '{{participation_rate}}', '{{dashboard_link}}'],
        body_tr: getBaseHtml('Analizler Tamamlandı', '<p>Sayın {{hr_name}}, {{company_name}} için <b>{{period}}</b> dönemi wellbeing araştırması sona erdi. %{{participation_rate}} katılım oranı ile elde edilen sonuçları dashboard üzerinden inceleyebilirsiniz.</p>', 'Sonuçları Gör', '{{dashboard_link}}'),
        body_en: getBaseHtml('Analysis Completed', '<p>Dear {{hr_name}}, the wellbeing research for <b>{{period}}</b> at {{company_name}} has ended. You can review the results obtained with a {{participation_rate}}% participation rate on the dashboard.</p>', 'View Results', '{{dashboard_link}}'),
        description: 'Anket kapanış ve rapor hazır bildirimi'
      },
      {
        slug: 'score_alert',
        subject_tr: '⚠️ Düşük Wellbeing Skoru Uyarısı',
        subject_en: '⚠️ Low Wellbeing Score Alert',
        variables: ['{{hr_name}}', '{{dimension}}', '{{score}}', '{{previous_score}}', '{{dashboard_link}}'],
        body_tr: getBaseHtml('Dikkat Gereken Alan Tespit Edildi', '<p>Sayın {{hr_name}}, son araştırmada <b>{{dimension}}</b> boyutu skoru <b>{{score}}</b> olarak ölçülmüştür (Önceki: {{previous_score}}). Bu alanda aksiyon almanız önerilir.</p>', 'Detayları İncele', '{{dashboard_link}}'),
        body_en: getBaseHtml('Area Requiring Attention Detected', '<p>Dear {{hr_name}}, the <b>{{dimension}}</b> dimension score in the latest research was measured as <b>{{score}}</b> (Previous: {{previous_score}}). Taking action in this area is recommended.</p>', 'Review Details', '{{dashboard_link}}'),
        description: 'Skor eşiği uyarısı'
      },
      {
        slug: 'ai_ready',
        subject_tr: '🤖 AI Analizi Hazır',
        subject_en: '🤖 AI Analysis is Ready',
        variables: ['{{hr_name}}', '{{period}}', '{{dashboard_link}}'],
        body_tr: getBaseHtml('Yapay Zeka Raporu Hazır', '<p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için açık uçlu yanıtlar yapay zeka tarafından analiz edildi. Stratejik önerileri panelinizde bulabilirsiniz.</p>', 'Analizi Oku', '{{dashboard_link}}'),
        body_en: getBaseHtml('AI Report is Ready', '<p>Dear {{hr_name}}, the open-ended responses for <b>{{period}}</b> have been analyzed by AI. You can find strategic suggestions in your panel.</p>', 'Read Analysis', '{{dashboard_link}}'),
        description: 'AI analizi tamamlandı bildirimi'
      },
      {
        slug: 'plan_expiry',
        subject_tr: '⚠️ Aboneliğiniz Sona Ermek Üzere',
        subject_en: '⚠️ Your Subscription is About to Expire',
        variables: ['{{company_name}}', '{{days_remaining}}', '{{plan_name}}'],
        body_tr: getBaseHtml('Abonelik Uyarısı', '<p>{{company_name}} için mevcut <b>{{plan_name}}</b> paketinizin süresi {{days_remaining}} gün içinde dolacaktır. Hizmet kesintisi yaşamamak için lütfen yenileyin.</p>', 'Şimdi Yenile', '{{platform_url}}/settings/billing'),
        body_en: getBaseHtml('Subscription Warning', '<p>Your current <b>{{plan_name}}</b> package for {{company_name}} will expire in {{days_remaining}} days. Please renew to avoid service interruption.</p>', 'Renew Now', '{{platform_url}}/settings/billing'),
        description: 'Plan bitiş uyarısı'
      },
      {
        slug: 'report_ready',
        subject_tr: '📑 Raporunuz İndirilmeye Hazır',
        subject_en: '📑 Your Report is Ready for Download',
        variables: ['{{hr_name}}', '{{period}}', '{{format}}', '{{download_link}}'],
        body_tr: getBaseHtml('Rapor Hazır', '<p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi için talep ettiğiniz <b>{{format}}</b> formatındaki rapor oluşturuldu.</p>', 'Raporu İndir', '{{download_link}}'),
        body_en: getBaseHtml('Report Ready', '<p>Dear {{hr_name}}, the report in <b>{{format}}</b> format you requested for <b>{{period}}</b> has been created.</p>', 'Download Report', '{{download_link}}'),
        description: 'İndirilebilir rapor bildirimi'
      },
      {
        slug: 'report_failed',
        subject_tr: '❌ Rapor Oluşturulamadı',
        subject_en: '❌ Report Generation Failed',
        variables: ['{{hr_name}}', '{{period}}', '{{format}}', '{{support_email}}'],
        body_tr: getBaseHtml('Hata Oluştu', '<p>Sayın {{hr_name}}, <b>{{period}}</b> dönemi raporu oluşturulurken teknik bir sorun yaşandı. Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.</p>', 'Yardım Al', 'mailto:{{support_email}}'),
        body_en: getBaseHtml('An Error Occurred', '<p>Dear {{hr_name}}, a technical problem occurred while generating the <b>{{period}}</b> report. Please try again or contact the support team.</p>', 'Get Help', 'mailto:{{support_email}}'),
        description: 'Rapor hata bildirimi'
      },
      {
        slug: 'draft_reminder',
        subject_tr: '📝 Yarım Kalan Anketiniz Sizi Bekliyor',
        subject_en: '📝 Your Incomplete Survey is Waiting',
        variables: ['{{full_name}}', '{{survey_title}}', '{{survey_link}}', '{{due_date}}'],
        body_tr: getBaseHtml('Nerede Kalmıştık?', '<p>Merhaba {{full_name}}, <b>{{survey_title}}</b> anketine başladınız ancak henüz bitirmediniz. Kaldığınız yerden devam ederek sonuca ulaşabilirsiniz.</p>', 'Devam Et', '{{survey_link}}'),
        body_en: getBaseHtml('Where Were We?', "<p>Hello {{full_name}}, you started the <b>{{survey_title}}</b> survey but haven't finished yet. You can continue from where you left off.</p>", 'Continue', '{{survey_link}}'),
        description: 'Taslak anket hatırlatması'
      },
      {
        slug: 'campaign_bounced',
        subject_tr: '⚠️ Teslim Edilemeyen Mailler',
        subject_en: '⚠️ Undelivered Emails',
        variables: ['{{hr_name}}', '{{bounced_count}}', '{{dashboard_link}}'],
        body_tr: getBaseHtml('Teslimat Sorunu', '<p>Sayın {{hr_name}}, son kampanyada <b>{{bounced_count}}</b> adet mail alıcıya ulaşılamadığı için geri döndü. Lütfen mail adreslerini kontrol edin.</p>', 'Listeyi Gör', '{{dashboard_link}}'),
        body_en: getBaseHtml('Delivery Issue', '<p>Dear {{hr_name}}, in the latest campaign, <b>{{bounced_count}}</b> emails bounced back because they could not reach the recipient. Please check the email addresses.</p>', 'View List', '{{dashboard_link}}'),
        description: 'Hatalı mail uyarısı'
      }
    ];

    for (const t of templates) {
      await queryRunner.query("INSERT INTO mail_templates (slug, subject_tr, subject_en, body_tr, body_en, variables, description) VALUES ($1, $2, $3, $4, $5, $6, $7)", [t.slug, t.subject_tr, t.subject_en, t.body_tr, t.body_en, JSON.stringify(t.variables), t.description]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS mail_templates CASCADE");
  }
}
