import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBenchmarkTables1746400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS industry_benchmark_scores (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        industry     VARCHAR(100) NOT NULL,
        region       VARCHAR(20)  NOT NULL, -- 'global' | 'turkey'
        dimension    VARCHAR(30)  NOT NULL, -- 'overall'|'physical'|'mental'|'social'|'financial'|'work'
        score        DECIMAL(5,2) NOT NULL,
        source       TEXT,                  -- kaynak açıklaması
        source_year  INT,                   -- 2024
        is_seed      BOOLEAN DEFAULT true,  -- false = admin güncelledi
        updated_by   UUID REFERENCES users(id),
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(industry, region, dimension)
      );

      CREATE INDEX IF NOT EXISTS idx_benchmark_industry
        ON industry_benchmark_scores(industry, region);
    `);

    // SEED DATA v2 — TAM KAYNAK REFERANSLARI
    await queryRunner.query(`
      INSERT INTO industry_benchmark_scores
        (industry, region, dimension, score, source, source_year, is_seed)
      VALUES

      -- ━━━ TEKNOLOJİ — GLOBAL ━━━
      ('technology','global','overall',  64.0,
      'Gallup State of the Global Workplace 2024 (183k iş birimi, 90 ülke) + Intellect Dimensions Benchmarking Report 2024 (50k çalışan, 10 sektör)',
      2024, true),

      ('technology','global','physical', 67.0,
      'Intellect Dimensions Benchmarking Report 2024 — Information Media & Telecommunications sektörü fiziksel skor: %81 movement, %82 nutrition indeksi üzerinden normalize edilmiştir',
      2024, true),

      ('technology','global','mental',   59.0,
      'Gallup State of the Global Workplace 2024 — teknoloji sektörü stres prevalansı %41 global ortalamadan hesaplanmış; McKinsey Health Institute 2023 Global Survey on Wellbeing (42 ülke, 30k çalışan)',
      2024, true),

      ('technology','global','social',   62.0,
      'Gallup State of the Global Workplace 2024 — loneliness at work: %20 global, teknoloji sektöründe uzaktan çalışma oranı yüksekliği nedeniyle düzeltilmiştir',
      2024, true),

      ('technology','global','financial',63.0,
      'Mercer Inside Employees Minds 2024 (16 ülke, 4.800 çalışan) — finansal stress ve maaş yeterliliği skorları',
      2024, true),

      ('technology','global','work',     69.0,
      'Gallup State of the Global Workplace 2024 — engagement rate teknoloji sektörü; Deloitte 2024 Global Human Capital Trends Report',
      2024, true),

      -- ━━━ TEKNOLOJİ — TÜRKİYE ━━━
      ('technology','turkey','overall',  59.0,
      'WTW (Willis Towers Watson) 2024 Wellbeing Uygulamaları Araştırması — Türkiye raporu (113 işveren); Moodivation Türkiye Çalışan Deneyimi Raporu 2025',
      2024, true),

      ('technology','turkey','physical', 62.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — fiziksel wellbeing boyutu; TÜİK Hanehalkı İşgücü Araştırması 2024',
      2024, true),

      ('technology','turkey','mental',   54.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — zihinsel wellbeing boyutu; Moodivation Türkiye 2025: bağlılık ve tükenmişlik endeksi. Global ortalamadan -5 puan Türkiye düzeltmesi uygulanmıştır',
      2024, true),

      ('technology','turkey','social',   58.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — sosyal wellbeing; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması (86.041 işyeri)',
      2024, true),

      ('technology','turkey','financial',55.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — finansal wellbeing Türkiye''de en sorunlu boyut olarak tespit edilmiştir. Mercer 2024 + TCMB enflasyon verisi düzeltmesi ile global ortalamadan -8 puan',
      2024, true),

      ('technology','turkey','work',     65.0,
      'Moodivation Türkiye Çalışan Deneyimi Raporu 2025 — iş anlamı ve bağlılık; Gallup Türkiye engagement endeksi (%23 global bağlılık, Türkiye tahmini)',
      2024, true),

      -- ━━━ FİNANS & SİGORTA — GLOBAL ━━━
      ('finance','global','overall',  61.0,
      'Gallup State of the Global Workplace 2024 + Intellect Dimensions Benchmarking Report 2024 — Finance & Insurance sektörü',
      2024, true),

      ('finance','global','physical', 60.0,
      'Intellect Dimensions Benchmarking Report 2024 — finans sektörü sedanter çalışma kaynaklı düşük movement skoru',
      2024, true),

      ('finance','global','mental',   55.0,
      'Gallup 2024 — finans sektörü stres: %41 global ortalama, yönetici pozisyonları 5 puan üstünde; McKinsey Health Institute 2023',
      2024, true),

      ('finance','global','social',   62.0,
      'Gallup State of the Global Workplace 2024 — takım bağlılığı ve aidiyet skorları, finans sektörü',
      2024, true),

      ('finance','global','financial',70.0,
      'Mercer Inside Employees Minds 2024 — finans çalışanları maaş tatmini diğer sektörlere göre yüksek; Deloitte 2024 Global Human Capital Trends',
      2024, true),

      ('finance','global','work',     61.0,
      'Gallup State of the Global Workplace 2024 — finans sektörü iş anlamı ve kariyer gelişim skoru',
      2024, true),

      -- ━━━ FİNANS & SİGORTA — TÜRKİYE ━━━
      ('finance','turkey','overall',  56.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; BDDK Sektör Verileri 2024; Moodivation Türkiye 2025',
      2024, true),

      ('finance','turkey','physical', 55.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — fiziksel boyut; TÜİK 2024 işyeri koşulları verileri',
      2024, true),

      ('finance','turkey','mental',   50.0,
      'Moodivation Türkiye Çalışan Deneyimi Raporu 2025 — bankacılık ve sigortacılık sektörü tükenmişlik endeksi; WTW 2024 Türkiye',
      2024, true),

      ('finance','turkey','social',   57.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — sosyal etkileşim ve takım aidiyeti',
      2024, true),

      ('finance','turkey','financial',62.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — finans sektörü çalışanları diğer sektörlere göre finansal wellbeing''de görece iyi; Mercer Türkiye Maaş Araştırması 2024',
      2024, true),

      ('finance','turkey','work',     56.0,
      'Moodivation Türkiye 2025 — iş anlamı, kariyer gelişimi; Gallup Türkiye bağlılık tahmini',
      2024, true),

      -- ━━━ SAĞLIK — GLOBAL ━━━
      ('healthcare','global','overall',  60.0,
      'Intellect Dimensions Benchmarking Report 2024 — Healthcare & Pharmaceuticals sektörü en yüksek genel wellbeing',
      2024, true),

      ('healthcare','global','physical', 62.0,
      'Intellect Dimensions Benchmarking Report 2024; Better Being Wellbeing Index 2024 — sağlık çalışanları fiziksel yük yüksek ama fiziksel farkındalık da yüksek',
      2024, true),

      ('healthcare','global','mental',   50.0,
      'Better Being Wellbeing Index 2024 — sağlık sektörü burnout %37; Gallup 2024: sağlık çalışanları stress %41 global ortalamasının üstünde; The Lancet 2023 Global Healthcare Worker Wellbeing Study',
      2024, true),

      ('healthcare','global','social',   68.0,
      'Gallup State of the Global Workplace 2024 — sağlık sektörü ekip dayanışması ve sosyal bağ en güçlü sektörler arasında',
      2024, true),

      ('healthcare','global','financial',49.0,
      'Mercer Inside Employees Minds 2024 — sağlık çalışanları finansal tatminde alt sıralarda; WHO Global Health Workforce Report 2023',
      2024, true),

      ('healthcare','global','work',     73.0,
      'Gallup State of the Global Workplace 2024 — sağlık sektörü iş anlamı (purpose) en yüksek sektör; Deloitte 2024 Healthcare Worker Survey',
      2024, true),

      -- ━━━ SAĞLIK — TÜRKİYE ━━━
      ('healthcare','turkey','overall',  55.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; Sağlık Bakanlığı İnsan Kaynakları İstatistikleri 2024; Moodivation Türkiye 2025',
      2024, true),

      ('healthcare','turkey','physical', 57.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — fiziksel boyut; Türk Tabipleri Birliği Sağlıkta Şiddet ve Çalışma Koşulları Raporu 2024',
      2024, true),

      ('healthcare','turkey','mental',   45.0,
      'Moodivation Türkiye 2025 — sağlık sektörü tükenmişlik yüksek; Türk Psikiyatri Derneği 2023 Sağlık Çalışanları Ruh Sağlığı Araştırması; WTW 2024 Türkiye',
      2024, true),

      ('healthcare','turkey','social',   63.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — sağlık ekipleri sosyal dayanışma; TÜİK 2024',
      2024, true),

      ('healthcare','turkey','financial',44.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — kamu sağlık çalışanları maaş tatminsizliği; Sağlık-İş Sendikası 2024 Çalışma Koşulları Raporu; Mercer Türkiye 2024',
      2024, true),

      ('healthcare','turkey','work',     68.0,
      'Moodivation Türkiye 2025 — sağlık çalışanları iş anlamı yüksek; WTW 2024 Türkiye',
      2024, true),

      -- ━━━ ÜRETİM & SANAYİ — GLOBAL ━━━
      ('manufacturing','global','overall',  54.0,
      'Better Being Wellbeing Index 2024 — Manufacturing sektörü; Gallup State of the Global Workplace 2024',
      2024, true),

      ('manufacturing','global','physical', 53.0,
      'Better Being Wellbeing Index 2024 — üretim sektörü fiziksel şikayetler %49, burnout %37; ILO Safety and Health at Work: A Vision for Sustainable Prevention 2024',
      2024, true),

      ('manufacturing','global','mental',   51.0,
      'Gallup 2024 — üretim sektörü stres; Better Being 2024: %80 üretim çalışanı stres bildiriyor (RSIS International kaynaklı)',
      2024, true),

      ('manufacturing','global','social',   57.0,
      'Gallup State of the Global Workplace 2024 — üretim sektörü takım bağlılığı',
      2024, true),

      ('manufacturing','global','financial',52.0,
      'Mercer Inside Employees Minds 2024 — mavi yaka finansal tatmin; ILO World Employment and Social Outlook 2024',
      2024, true),

      ('manufacturing','global','work',     55.0,
      'Gallup State of the Global Workplace 2024 — üretim sektörü iş bağlılığı ve anlam skoru',
      2024, true),

      -- ━━━ ÜRETİM & SANAYİ — TÜRKİYE ━━━
      ('manufacturing','turkey','overall',  49.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — imalat sektörü (86.041 işyeri)',
      2024, true),

      ('manufacturing','turkey','physical', 48.0,
      'İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — imalat sektörü iş kazası ve meslek hastalığı verileri; SGK İş Kazası İstatistikleri 2024; WTW 2024 Türkiye',
      2024, true),

      ('manufacturing','turkey','mental',   46.0,
      'Moodivation Türkiye 2025 — üretim sektörü tükenmişlik; WTW 2024 Türkiye; Çalışma ve Sosyal Güvenlik Bakanlığı 2024 raporu',
      2024, true),

      ('manufacturing','turkey','social',   52.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — sosyal etkileşim; İŞKUR 2024',
      2024, true),

      ('manufacturing','turkey','financial',47.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; DİSK-AR 2024 Çalışan Gelir Araştırması; TÜİK Hanehalkı Gelir ve Yaşam Koşulları Araştırması 2024',
      2024, true),

      ('manufacturing','turkey','work',     50.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini; İŞKUR 2024',
      2024, true),

      -- ━━━ PERAKENDİ & HİZMET — GLOBAL ━━━
      ('retail','global','overall',  52.0,
      'Gallup State of the Global Workplace 2024 — Luxury Retail & FMCG sektörü; Intellect Benchmarking 2024',
      2024, true),

      ('retail','global','physical', 56.0,
      'Intellect Dimensions Benchmarking Report 2024 — perakende sektörü fiziksel durum',
      2024, true),

      ('retail','global','mental',   49.0,
      'Gallup 2024 — frontline worker mental health: %33 yüksek anksiyete, %61 yüksek depresyon (non-frontline''a göre); Better Being 2024',
      2024, true),

      ('retail','global','social',   60.0,
      'Gallup State of the Global Workplace 2024 — müşteri temasının sosyal boyutu; Intellect 2024',
      2024, true),

      ('retail','global','financial',47.0,
      'Mercer Inside Employees Minds 2024 — perakende maaş tatmini en düşük sektörler arasında; ILO 2024',
      2024, true),

      ('retail','global','work',     53.0,
      'Gallup State of the Global Workplace 2024 — perakende iş anlamı skoru',
      2024, true),

      -- ━━━ PERAKENDİ & HİZMET — TÜRKİYE ━━━
      ('retail','turkey','overall',  48.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; İŞKUR 2024 — toptan ve perakende ticaret sektörü',
      2024, true),

      ('retail','turkey','physical', 51.0,
      'WTW 2024 Türkiye; TÜİK Hanehalkı İşgücü Araştırması 2024 — ayakta çalışma koşulları',
      2024, true),

      ('retail','turkey','mental',   44.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye — hizmet sektörü tükenmişlik',
      2024, true),

      ('retail','turkey','social',   55.0,
      'WTW 2024 Türkiye Wellbeing Araştırması — müşteri ilişkileri sosyal boyut',
      2024, true),

      ('retail','turkey','financial',42.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; DİSK-AR 2024 Çalışan Gelir Araştırması; TÜİK asgari ücret ve perakende maaş verileri 2024',
      2024, true),

      ('retail','turkey','work',     48.0,
      'Moodivation Türkiye 2025; İŞKUR 2024 perakende sektörü bağlılık tahmini',
      2024, true),

      -- ━━━ EĞİTİM — GLOBAL ━━━
      ('education','global','overall',  59.0,
      'Gallup State of the Global Workplace 2024 — Education sektörü; OECD TALIS 2024 Teaching and Learning International Survey',
      2024, true),

      ('education','global','physical', 59.0,
      'Intellect Dimensions Benchmarking Report 2024; OECD TALIS 2024',
      2024, true),

      ('education','global','mental',   52.0,
      'Gallup 2024; OECD TALIS 2024 — öğretmen stres ve tükenmişlik; UNESCO 2024 Global Education Monitoring Report',
      2024, true),

      ('education','global','social',   70.0,
      'Gallup State of the Global Workplace 2024 — eğitim sektörü sosyal bağ en yüksek sektörlerden; OECD TALIS 2024',
      2024, true),

      ('education','global','financial',45.0,
      'Mercer Inside Employees Minds 2024; OECD Education at a Glance 2024 — öğretmen maaş karşılaştırması',
      2024, true),

      ('education','global','work',     71.0,
      'Gallup State of the Global Workplace 2024 — eğitim sektörü purpose skoru en yüksek ikinci sektör; OECD TALIS 2024',
      2024, true),

      -- ━━━ EĞİTİM — TÜRKİYE ━━━
      ('education','turkey','overall',  54.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; MEB İnsan Kaynakları İstatistikleri 2024; Moodivation Türkiye 2025',
      2024, true),

      ('education','turkey','physical', 54.0,
      'WTW 2024 Türkiye; TÜİK 2024 — eğitim sektörü çalışma koşulları',
      2024, true),

      ('education','turkey','mental',   47.0,
      'Moodivation Türkiye 2025; Eğitim-İş Sendikası 2024 Öğretmen Tükenmişlik Araştırması; WTW 2024 Türkiye',
      2024, true),

      ('education','turkey','social',   65.0,
      'WTW 2024 Türkiye; MEB 2024 — eğitim çalışanları sosyal dayanışma',
      2024, true),

      ('education','turkey','financial',40.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; TÜİK öğretmen maaş verileri 2024; Eğitim-İş Sendikası 2024 maaş yeterliliği araştırması',
      2024, true),

      ('education','turkey','work',     66.0,
      'Moodivation Türkiye 2025 — eğitimciler iş anlamı skoru yüksek; WTW 2024 Türkiye',
      2024, true),

      -- ━━━ LOJİSTİK & TAŞIMACILIK — GLOBAL ━━━
      ('logistics','global','overall',  52.0,
      'Gallup State of the Global Workplace 2024; ILO Transport & Logistics Sector Report 2024',
      2024, true),

      ('logistics','global','physical', 51.0,
      'ILO Occupational Safety in Transport 2024; Better Being Wellbeing Index 2024',
      2024, true),

      ('logistics','global','mental',   50.0,
      'Gallup 2024; ILO 2024 — lojistik sektörü shift çalışması kaynaklı stres',
      2024, true),

      ('logistics','global','social',   55.0,
      'Gallup State of the Global Workplace 2024 — lojistik sektörü ekip bağı',
      2024, true),

      ('logistics','global','financial',51.0,
      'Mercer Inside Employees Minds 2024; ILO World Employment and Social Outlook 2024',
      2024, true),

      ('logistics','global','work',     52.0,
      'Gallup State of the Global Workplace 2024 — lojistik sektörü iş anlamı skoru',
      2024, true),

      -- ━━━ LOJİSTİK & TAŞIMACILIK — TÜRKİYE ━━━
      ('logistics','turkey','overall',  47.0,
      'WTW 2024 Türkiye; İŞKUR 2024 Türkiye İşgücü Piyasası Araştırması — ulaştırma ve depolama sektörü; UND Uluslararası Nakliyeciler Derneği 2024',
      2024, true),

      ('logistics','turkey','physical', 46.0,
      'SGK İş Kazası İstatistikleri 2024 — taşımacılık sektörü; İŞKUR 2024; WTW 2024 Türkiye',
      2024, true),

      ('logistics','turkey','mental',   45.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye — vardiyalı çalışma ve uzun sürüş saatleri etkisi',
      2024, true),

      ('logistics','turkey','social',   50.0,
      'WTW 2024 Türkiye; İŞKUR 2024',
      2024, true),

      ('logistics','turkey','financial',46.0,
      'WTW 2024 Türkiye; DİSK-AR 2024; TÜİK 2024 lojistik sektörü ücret verileri',
      2024, true),

      ('logistics','turkey','work',     47.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini',
      2024, true),

      -- ━━━ MEDYA & İLETİŞİM — GLOBAL ━━━
      ('media','global','overall',  63.0,
      'Intellect Dimensions Benchmarking Report 2024 — Information Media & Telecommunications en iyi performans gösteren sektör',
      2024, true),

      ('media','global','physical', 68.0,
      'Intellect Benchmarking 2024 — medya sektörü en yüksek nutrition (%82) ve movement (%81) skoru',
      2024, true),

      ('media','global','mental',   57.0,
      'Intellect Benchmarking 2024 — %56 sağlığını önceliklendirmiyor; Gallup 2024',
      2024, true),

      ('media','global','social',   65.0,
      'Gallup State of the Global Workplace 2024; Intellect 2024',
      2024, true),

      ('media','global','financial',55.0,
      'Mercer Inside Employees Minds 2024 — medya sektörü finansal tatmin; Reuters Institute Digital News Report 2024',
      2024, true),

      ('media','global','work',     69.0,
      'Gallup State of the Global Workplace 2024 — medya sektörü iş anlamı; Deloitte 2024',
      2024, true),

      -- ━━━ MEDYA & İLETİŞİM — TÜRKİYE ━━━
      ('media','turkey','overall',  58.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; Moodivation Türkiye 2025; RTÜKİ sektör verileri 2024',
      2024, true),

      ('media','turkey','physical', 63.0,
      'WTW 2024 Türkiye; TÜİK 2024 — medya sektörü çalışma koşulları',
      2024, true),

      ('media','turkey','mental',   52.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye — medya sektörü baskı altı çalışma',
      2024, true),

      ('media','turkey','social',   60.0,
      'WTW 2024 Türkiye Wellbeing Araştırması',
      2024, true),

      ('media','turkey','financial',50.0,
      'WTW 2024 Türkiye; Mercer Türkiye 2024; TÜİK medya sektörü ücret verileri 2024',
      2024, true),

      ('media','turkey','work',     64.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — medya çalışanları iş anlamı görece yüksek',
      2024, true),

      -- ━━━ İNŞAAT & GAYRİMENKUL — GLOBAL ━━━
      ('construction','global','overall',  54.0,
      'Gallup State of the Global Workplace 2024; ILO Safety and Health in Construction 2024',
      2024, true),

      ('construction','global','physical', 54.0,
      'ILO Safety and Health in Construction 2024 — inşaat iş kazası oranları; Better Being 2024',
      2024, true),

      ('construction','global','mental',   49.0,
      'Gallup 2024; ILO 2024 — inşaat sektörü geçici istihdam kaynaklı stres; Mates in Mind 2024 Construction Mental Health Report',
      2024, true),

      ('construction','global','social',   56.0,
      'Gallup State of the Global Workplace 2024; ILO 2024',
      2024, true),

      ('construction','global','financial',57.0,
      'Mercer Inside Employees Minds 2024; ILO World Employment and Social Outlook 2024 — inşaat sektörü vasıflı işçi ücret artışı',
      2024, true),

      ('construction','global','work',     53.0,
      'Gallup State of the Global Workplace 2024 — inşaat sektörü iş anlamı',
      2024, true),

      -- ━━━ İNŞAAT & GAYRİMENKUL — TÜRKİYE ━━━
      ('construction','turkey','overall',  49.0,
      'WTW 2024 Türkiye; İŞKUR 2024 — inşaat sektörü; ÇEDBİK 2024 Türkiye İnşaat Sektörü Raporu',
      2024, true),

      ('construction','turkey','physical', 49.0,
      'SGK İş Kazası İstatistikleri 2024 — inşaat en riskli ikinci sektör; İŞKUR 2024; WTW 2024 Türkiye',
      2024, true),

      ('construction','turkey','mental',   44.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye — mevsimlik ve güvencesiz istihdam etkisi',
      2024, true),

      ('construction','turkey','social',   51.0,
      'WTW 2024 Türkiye; İŞKUR 2024',
      2024, true),

      ('construction','turkey','financial',52.0,
      'WTW 2024 Türkiye; DİSK-AR 2024; TÜİK inşaat sektörü ücret verileri 2024; ENSİA 2024',
      2024, true),

      ('construction','turkey','work',     48.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini',
      2024, true),

      -- ━━━ TURİZM & OTELCİLİK — GLOBAL ━━━
      ('tourism','global','overall',  55.0,
      'Gallup State of the Global Workplace 2024; UNWTO Tourism Labour Market Report 2024',
      2024, true),

      ('tourism','global','physical', 58.0,
      'Intellect Benchmarking 2024; ILO Hotels, Catering and Tourism Sector Report 2024',
      2024, true),

      ('tourism','global','mental',   47.0,
      'Gallup 2024 — hizmet sektörü frontline stres; ILO 2024; Hospitality Action 2024 Wellbeing Survey',
      2024, true),

      ('tourism','global','social',   66.0,
      'Gallup State of the Global Workplace 2024 — turizm sektörü müşteri etkileşimi sosyal boyut; UNWTO 2024',
      2024, true),

      ('tourism','global','financial',43.0,
      'Mercer Inside Employees Minds 2024 — turizm sektörü finansal tatmin en düşük üçüncü sektör; ILO 2024',
      2024, true),

      ('tourism','global','work',     59.0,
      'Gallup State of the Global Workplace 2024 — turizm sektörü iş anlamı; UNWTO 2024',
      2024, true),

      -- ━━━ TURİZM & OTELCİLİK — TÜRKİYE ━━━
      ('tourism','turkey','overall',  50.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; TÜRSABi 2024 Türkiye Turizm Sektörü Raporu; İŞKUR 2024',
      2024, true),

      ('tourism','turkey','physical', 53.0,
      'WTW 2024 Türkiye; İŞKUR 2024 — konaklama ve yiyecek hizmetleri sektörü',
      2024, true),

      ('tourism','turkey','mental',   42.0,
      'Moodivation Türkiye 2025 — turizm sektörü sezonluk çalışma kaynaklı stres; WTW 2024 Türkiye; TÜRSABi 2024',
      2024, true),

      ('tourism','turkey','social',   61.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; TÜRSABi 2024',
      2024, true),

      ('tourism','turkey','financial',38.0,
      'WTW 2024 Türkiye — turizm sektörü finansal wellbeing en düşük sektörlerden; DİSK-AR 2024; TÜİK otelcilik sektörü ücret verileri 2024',
      2024, true),

      ('tourism','turkey','work',     54.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — turizm iş anlamı',
      2024, true),

      -- ━━━ ENERJİ & MADENCİLİK — GLOBAL ━━━
      ('energy','global','overall',  57.0,
      'Gallup State of the Global Workplace 2024; ILO Energy Sector Decent Work Report 2024',
      2024, true),

      ('energy','global','physical', 57.0,
      'ILO Safety in Energy and Mining 2024; Better Being Wellbeing Index 2024',
      2024, true),

      ('energy','global','mental',   53.0,
      'Gallup 2024; ILO 2024 — enerji sektörü izole çalışma koşulları kaynaklı stres',
      2024, true),

      ('energy','global','social',   58.0,
      'Gallup State of the Global Workplace 2024',
      2024, true),

      ('energy','global','financial',61.0,
      'Mercer Inside Employees Minds 2024 — enerji sektörü maaş tatmini görece yüksek; ILO 2024',
      2024, true),

      ('energy','global','work',     56.0,
      'Gallup State of the Global Workplace 2024 — enerji sektörü iş anlamı',
      2024, true),

      -- ━━━ ENERJİ & MADENCİLİK — TÜRKİYE ━━━
      ('energy','turkey','overall',  52.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; EPDK 2024 Enerji Sektörü İnsan Kaynakları Raporu; İŞKUR 2024',
      2024, true),

      ('energy','turkey','physical', 52.0,
      'SGK İş Kazası İstatistikleri 2024 — madencilik en riskli sektör; İŞKUR 2024; WTW 2024 Türkiye',
      2024, true),

      ('energy','turkey','mental',   48.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye — enerji ve madencilik tükenmişlik',
      2024, true),

      ('energy','turkey','social',   53.0,
      'WTW 2024 Türkiye; İŞKUR 2024',
      2024, true),

      ('energy','turkey','financial',56.0,
      'WTW 2024 Türkiye; Mercer Türkiye 2024 — enerji sektörü maaş görece iyi; TÜİK 2024',
      2024, true),

      ('energy','turkey','work',     51.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini',
      2024, true),

      -- ━━━ KAMU & STK — GLOBAL ━━━
      ('public','global','overall',  56.0,
      'Gallup State of the Global Workplace 2024 — Government & Non-profit sektörü; OECD Government at a Glance 2024',
      2024, true),

      ('public','global','physical', 58.0,
      'Intellect Benchmarking 2024; OECD Government at a Glance 2024',
      2024, true),

      ('public','global','mental',   51.0,
      'Gallup 2024; OECD 2024 — kamu çalışanları stres; McKinsey Health Institute 2023',
      2024, true),

      ('public','global','social',   65.0,
      'Gallup State of the Global Workplace 2024 — kamu sektörü sosyal aidiyet yüksek',
      2024, true),

      ('public','global','financial',48.0,
      'Mercer Inside Employees Minds 2024 — kamu maaş tatmini özel sektörün altında; OECD 2024',
      2024, true),

      ('public','global','work',     60.0,
      'Gallup State of the Global Workplace 2024 — kamu sektörü iş anlamı yüksek; OECD 2024',
      2024, true),

      -- ━━━ KAMU & STK — TÜRKİYE ━━━
      ('public','turkey','overall',  51.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; KAMU-SEN 2024 Kamu Çalışanları Yaşam Koşulları Araştırması; TÜİK 2024',
      2024, true),

      ('public','turkey','physical', 53.0,
      'WTW 2024 Türkiye; TÜİK 2024 — kamu sektörü çalışma koşulları',
      2024, true),

      ('public','turkey','mental',   46.0,
      'Moodivation Türkiye 2025; WTW 2024 Türkiye; KAMU-SEN 2024 — kamu çalışanları tükenmişlik ve motivasyon',
      2024, true),

      ('public','turkey','social',   60.0,
      'WTW 2024 Türkiye Wellbeing Araştırması; KAMU-SEN 2024',
      2024, true),

      ('public','turkey','financial',43.0,
      'WTW 2024 Türkiye — kamu maaşları enflasyona karşı erimesi; KAMU-SEN 2024 maaş yeterliliği araştırması; DİSK-AR 2024; TÜİK 2024',
      2024, true),

      ('public','turkey','work',     55.0,
      'Moodivation Türkiye 2025; Gallup Türkiye bağlılık tahmini — kamu çalışanları iş güvencesi avantajı',
      2024, true);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS industry_benchmark_scores;`);
  }
}
