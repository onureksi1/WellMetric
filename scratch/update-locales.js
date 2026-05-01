const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, '../apps/web/public/locales');

const updates = {
  'tr/common.json': {
    "start_new": "Yeni Başlat",
    "load_draft": "Taslağı Yükle",
    "industry": "Sektör",
    "generate": "Oluştur",
    "cancel": "İptal",
    "months": {
      "january": "Ocak",
      "february": "Şubat",
      "march": "Mart",
      "april": "Nisan",
      "may": "Mayıs",
      "june": "Haziran",
      "july": "Temmuz",
      "august": "Ağustos",
      "september": "Eylül",
      "october": "Ekim",
      "november": "Kasım",
      "december": "Aralık"
    },
    "all_periods": "Tüm Dönemler",
    "all_statuses": "Tüm Durumlar",
    "waiting": "Bekliyor",
    "global_survey": "GLOBAL ANKET",
    "company_specific": "FİRMAYA ÖZEL",
    "due_date": "Son Tarih",
    "date_locale": "tr-TR"
  },
  'en/common.json': {
    "start_new": "Start New",
    "load_draft": "Load Draft",
    "industry": "Industry",
    "generate": "Generate",
    "cancel": "Cancel",
    "months": {
      "january": "January",
      "february": "February",
      "march": "March",
      "april": "April",
      "may": "May",
      "june": "June",
      "july": "July",
      "august": "August",
      "september": "September",
      "october": "October",
      "november": "November",
      "december": "December"
    },
    "all_periods": "All Periods",
    "all_statuses": "All Statuses",
    "waiting": "Waiting",
    "global_survey": "GLOBAL SURVEY",
    "company_specific": "COMPANY SPECIFIC",
    "due_date": "Due Date",
    "date_locale": "en-US"
  },
  'tr/admin.json': {
    "ai_generate": "AI ile Oluştur",
    "ai_generating": "AI Oluşturuyor...",
    "industries": {
      "title": "Sektör Yönetimi",
      "subtitle": "Firma sektörlerini yönetin. Varsayılan sektörler pasif yapılamaz.",
      "new": "Yeni Sektör",
      "default": "Varsayılan",
      "custom": "Özel",
      "default_readonly": "Varsayılan sektörler pasif yapılamaz",
      "updated": "Sektör güncellendi",
      "created": "Sektör oluşturuldu",
      "status_updated": "Durum güncellendi",
      "label_tr": "Sektör (TR)",
      "label_en": "Sektör (EN)",
      "edit_title": "Sektörü Düzenle",
      "new_title": "Yeni Sektör",
      "form_label_tr": "Türkçe Etiket",
      "form_label_en": "İngilizce Etiket",
      "placeholder_tr": "örn: Yazılım Geliştirme",
      "placeholder_en": "örn: Software Development",
      "slug_info": "Sektör kısa adı (slug) otomatik oluşturulmuştur ve değiştirilemez: {{slug}}"
    }
  },
  'en/admin.json': {
    "ai_generate": "Generate with AI",
    "ai_generating": "AI Generating...",
    "industries": {
      "title": "Industry Management",
      "subtitle": "Manage company industries. Default industries cannot be deactivated.",
      "new": "New Industry",
      "default": "Default",
      "custom": "Custom",
      "default_readonly": "Default industries cannot be deactivated",
      "updated": "Industry updated",
      "created": "Industry created",
      "status_updated": "Status updated",
      "label_tr": "Industry (TR)",
      "label_en": "Industry (EN)",
      "edit_title": "Edit Industry",
      "new_title": "New Industry",
      "form_label_tr": "Turkish Label",
      "form_label_en": "English Label",
      "placeholder_tr": "e.g. Software Development",
      "placeholder_en": "e.g. Software Development",
      "slug_info": "Industry slug has been auto-generated and cannot be changed: {{slug}}"
    }
  },
  'tr/dashboard.json': {
    "surveys": {
      "title": "Anket Takibi",
      "subtitle": "Devam eden ve tamamlanan anketlerin katılım oranları ve sonuçları.",
      "no_distribution": "Bu anket için henüz dağıtım yapılmadı.",
      "participation_status": "Katılım Durumu",
      "distributed": "Dağıtım Yapıldı",
      "view_results": "Sonuçları Gör",
      "start_distribution": "Dağıtım Başlat",
      "campaign_details": "Kampanya Detayları",
      "no_active_survey": "Şu an aktif bir anket bulunmuyor.",
      "past_surveys": "Geçmiş Anketler",
      "survey_title": "Anket Başlığı",
      "no_past_surveys": "Geçmiş anket bulunamadı."
    },
    "campaigns": {
      "new_distribution": "Yeni Dağıtım",
      "scheduled": "Zamanlandı",
      "sending": "Gönderiliyor",
      "sent": "Gönderildi",
      "cancelled": "İptal Edildi",
      "sent_short": "Gönder.",
      "open_rate": "Açılma",
      "click_rate": "Tıklama",
      "completion_short": "Tamam.",
      "remind_confirm": "Anketi tamamlamayanlara hatırlatma gönderilsin mi?",
      "remind": "Hatırlat",
      "no_campaigns": "Henüz kampanya yok",
      "no_campaigns_desc": "Anketlerinizi çalışanlarınıza ulaştırmak için yeni bir dağıtım başlatın.",
      "create_first": "İlk Dağıtımı Oluştur"
    }
  },
  'en/dashboard.json': {
    "surveys": {
      "title": "Survey Tracking",
      "subtitle": "Participation rates and results of ongoing and completed surveys.",
      "no_distribution": "No distribution has been made for this survey yet.",
      "participation_status": "Participation Status",
      "distributed": "Distributed",
      "view_results": "View Results",
      "start_distribution": "Start Distribution",
      "campaign_details": "Campaign Details",
      "no_active_survey": "There are no active surveys at the moment.",
      "past_surveys": "Past Surveys",
      "survey_title": "Survey Title",
      "no_past_surveys": "No past surveys found."
    },
    "campaigns": {
      "new_distribution": "New Distribution",
      "scheduled": "Scheduled",
      "sending": "Sending",
      "sent": "Sent",
      "cancelled": "Cancelled",
      "sent_short": "Sent",
      "open_rate": "Open Rate",
      "click_rate": "Click Rate",
      "completion_short": "Comp.",
      "remind_confirm": "Send reminder to those who haven't completed the survey?",
      "remind": "Remind",
      "no_campaigns": "No campaigns yet",
      "no_campaigns_desc": "Start a new distribution to reach your employees with your surveys.",
      "create_first": "Create First Distribution"
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

for (const [file, data] of Object.entries(updates)) {
  const filePath = path.join(localesPath, file);
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const merged = deepMerge(existing, data);
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    console.log(`Updated ${file}`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
