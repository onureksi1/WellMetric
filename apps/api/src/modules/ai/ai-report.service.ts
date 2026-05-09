import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { AIService } from './ai.service';
import { NotificationService } from '../notification/notification.service';
import { InAppNotificationService } from '../notification/in-app-notification.service';
import { ScoreService } from '../score/score.service';

@Injectable()
export class AIReportService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly aiService: AIService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly inAppNotifService: InAppNotificationService,
    private readonly scoreService: ScoreService,
  ) {}

  private readonly logger = new Logger(AIReportService.name);

  async generateComprehensiveReport(params: {
    companyId:    string;
    consultantId: string;
    period:       string;  // '2026-05'
    language:     'tr' | 'en';
    assessmentModel?: string;
    referenceModel?:  string;
  }): Promise<string> {

    // ── 1. VERİ TOPLAMA ──────────────────────────────────────────

    // Şirket bilgisi
    const company = await this.companyRepo.findOne({
      where: { id: params.companyId }
    });

    if (!company) throw new Error('Company not found');

    // Mevcut dönem skorları (6 boyut)
    const currentScores = await this.dataSource.query(`
      SELECT dimension, AVG(score) as score, COUNT(*) as respondent_count
      FROM wellbeing_scores
      WHERE company_id = $1
        AND period = $2
      GROUP BY dimension
    `, [params.companyId, params.period]);

    // Önceki dönem skorları (trend için)
    const prevPeriod = this.getPrevPeriod(params.period);
    const prevScores = await this.dataSource.query(`
      SELECT dimension, AVG(score) as score
      FROM wellbeing_scores
      WHERE company_id = $1
        AND period = $2
      GROUP BY dimension
    `, [params.companyId, prevPeriod]);

    // Departman bazlı skorlar
    const deptScores = await this.dataSource.query(`
      SELECT
        d.name as dept_name,
        ws.dimension,
        AVG(ws.score) as score,
        COUNT(DISTINCT sr.id) as respondents
      FROM wellbeing_scores ws
      JOIN departments d ON d.id = ws.department_id
      LEFT JOIN survey_responses sr ON sr.department_id = ws.department_id
        AND sr.company_id = ws.company_id
      WHERE ws.company_id = $1
        AND ws.period = $2
        AND ws.department_id IS NOT NULL
      GROUP BY d.name, ws.dimension
      ORDER BY d.name, ws.dimension
    `, [params.companyId, params.period]);

    // Sektörel benchmark
    const industry  = company.industry ?? 'technology';
    const benchmarks = await this.dataSource.query(`
      SELECT dimension, score, source
      FROM industry_benchmark_scores
      WHERE industry = $1 AND region = 'turkey'
      ORDER BY dimension
    `, [industry]);

    // Risk tespiti — 45'in altındaki boyutlar
    const riskAreas = currentScores
      .filter((s: any) => Number(s.score) < 45)
      .sort((a: any, b: any) => Number(a.score) - Number(b.score));

    // Trend verisi (ScoreService kullanarak)
    const trendData = await this.scoreService.getTrendData({
      companyId: params.companyId,
      months: 6,
    });

    // ── 2. AI PROMPT ─────────────────────────────────────────────
    
    // ── Model tanımları ──────────────────────────────────────────
    const MODEL_DEFINITIONS: Record<string, {
      name:          string;
      framework:     string;
      dimensions:    string[];
      terminology:   string;
      analysis_note: string;
    }> = {
      wellbeing_metric: {
        name:      'WellBeing Metric Modeli',
        framework: 'WellBeing Metric Framework — WHO-5 Wellbeing Index (WHO,1998), Gallup Q12 Employee Engagement Survey (Gallup,2024), PERMA Model (Seligman,2011), CFPB Financial Wellbeing Scale (CFPB,2017) sentezi',
        dimensions: ['Fiziksel','Zihinsel','Sosyal','Finansal','İş & Anlam'],
        terminology: `
          Fiziksel: Beden sağlığı, hareket, uyku, beslenme, ergonomi
          [WHO tanımları referans alınmıştır]

          Zihinsel: Ruh sağlığı, stres, tükenmişlik, psikolojik güvenlik
          [WHO-5 Wellbeing Index referans alınmıştır]

          Sosyal: Aidiyet, ekip ilişkileri, sosyal bağ, iletişim kalitesi
          [Huppert & So (2013) Flourishing Scale referans alınmıştır]

          Finansal: Ekonomik güvenlik, maaş tatmini, geleceğe güven
          [CFPB Financial Wellbeing Scale referans alınmıştır]

          İş & Anlam: Bağlılık, amaç, büyüme, iş-yaşam dengesi
          [Gallup Q12 + Seligman PERMA referans alınmıştır]
        `,
        analysis_note: `
          Her boyutu 0-100 üzerinden değerlendir.
          70+ Güçlü | 50-69 Gelişime Açık | 50 altı Risk
          Raporun sonuna şu notu ekle:
          "WellBeing Metric Framework; WHO-5 Wellbeing Index,
          Gallup Q12 Employee Engagement Survey, Seligman PERMA Modeli
          ve CFPB Financial Wellbeing Scale referans alınarak
          geliştirilmiş bütünsel bir kurumsal wellbeing çerçevesidir."
        `,
      },
      perma: {
        name:      'PERMA Modeli',
        framework: 'Seligman, M.E.P. (2011). Flourish. Free Press.',
        dimensions: [
          'P — Pozitif Duygu',
          'E — Bağlılık',
          'R — İlişkiler',
          'M — Anlam',
          'A — Başarı',
        ],
        terminology: `
          P: Neşe, minnettarlık, umut, ilham, merak
          E: Akış deneyimi, güçlü yönleri kullanma, derin odak
          R: Anlamlı ilişkiler, güven, sosyal destek
          M: Kendinden büyük amaca hizmet, değer uyumu
          A: Başarı, ustalık, hedef gerçekleştirme
        `,
        analysis_note: `
          Her PERMA boyutunu ayrı değerlendir.
          Flourishing ve Languishing kavramlarını kullan.
          Pozitif psikoloji perspektifinden öneriler sun.
        `,
      },
      who5_gallup: {
        name:      'WHO-5 + Gallup Q12 Modeli',
        framework: 'WHO-5 Wellbeing Index (WHO,1998) + Gallup Q12 Employee Engagement Survey',
        dimensions: [
          'Zihinsel Wellbeing (WHO-5)',
          'İş Bağlılığı (Gallup Q12)',
          'Amaç & Misyon',
          'Yönetim Desteği',
          'Büyüme & Gelişim',
        ],
        terminology: `
          WHO-5: Neşe, Sakinlik, Canlılık, Dinçlik, Günlük İlgi
          Gallup Q12: Beklenti netliği, Araç yeterliliği, Takdir,
          Misyon bağlılığı, Gelişim, Görüş alınma, Sosyal bağ
        `,
        analysis_note: `
          WHO-5 skoru 0-100 normalize et.
          Gallup için engaged/not engaged/actively disengaged kullan.
          İki çerçeveyi birleştir: klinik + kurumsal perspektif.
        `,
      },
      cipd: {
        name:      'CIPD İş Yeri Wellbeing Modeli',
        framework: 'CIPD Health and Wellbeing at Work Framework (2023)',
        dimensions: [
          'Fiziksel Sağlık',
          'Psikolojik Wellbeing',
          'İş-Yaşam Dengesi',
          'Sosyal Sermaye',
          'Finansal Güvenlik',
        ],
        terminology: `
          Fiziksel: Devamsızlık, presenteeism, ergonomi
          Psikolojik: Stres, psikolojik güvenlik, EAP
          İş-Yaşam: Esnek çalışma, fazla mesai, kopma hakkı
          Sosyal: Ekip uyumu, liderlik, çeşitlilik
          Finansal: Ücret adaleti, yan haklar
        `,
        analysis_note: `
          CIPD Good Work çerçevesini referans al.
          İK politikası ve işveren yükümlülükleri perspektifinden değerlendir.
        `,
      },
    };

    const assessmentModel  = params.assessmentModel ?? company.assessmentModel ?? 'wellbeing_metric';
    const referenceModel   = params.referenceModel;
    const primaryDef       = MODEL_DEFINITIONS[assessmentModel]
      ?? MODEL_DEFINITIONS['wellbeing_metric'];
    const referenceDef     = referenceModel
      ? MODEL_DEFINITIONS[referenceModel]
      : null;

    const methodologySection = `
## METODOLOJİ

Ana Çerçeve: ${primaryDef.name}
Referans: ${primaryDef.framework}
Boyutlar: ${primaryDef.dimensions.join(' · ')}

Terminoloji:
${primaryDef.terminology}

Analiz Notu:
${primaryDef.analysis_note}

${referenceDef ? `
Destekleyici Çerçeve: ${referenceDef.name}
Referans: ${referenceDef.framework}

${referenceDef.terminology}

KURAL: Raporu ${primaryDef.name} terminolojisiyle yaz.
${referenceDef.name} perspektifinden her boyuta ek yorum ve
zenginleştirme ekle. İki çerçeveyi karşılaştır.
` : ''}

ZORUNLU: Raporun SONUÇ bölümünün sonuna şunu ekle:
"Bu analiz ${primaryDef.framework} çerçevesinde${
  referenceDef
    ? `, ${referenceDef.framework} referans alınarak`
    : ''
} hazırlanmıştır."
`;

    const scoreTable = currentScores.map((s: any) => {
      const bench  = benchmarks.find((b: any) => b.dimension === s.dimension);
      const trend  = trendData.changes[s.dimension];
      const change = trend && trend.delta !== null
        ? (trend.delta > 0 ? `+${trend.delta}` : trend.delta)
        : "İlk dönem";
      return `${s.dimension}: ${Number(s.score).toFixed(1)}/100 | Benchmark: ${bench?.score ?? "N/A"} | Trend: ${change}`;
    }).join("\n");

    const deptTable = (() => {
      const grouped: Record<string, any[]> = {};
      for (const d of deptScores) {
        if (!grouped[d.dept_name]) grouped[d.dept_name] = [];
        grouped[d.dept_name].push(d);
      }
      return Object.entries(grouped).map(([dept, scores]) =>
        `${dept}: ${scores.map((s: any) => `${s.dimension}=${Number(s.score).toFixed(0)}`).join(", ")}`
      ).join("\n");
    })();

    const langName = params.language === "en" ? "English" : "Türkçe";

    const trendSection = trendData.periods.length > 1 ? `
## DÖNEMSEL TREND ANALİZİ

${Object.entries(trendData.changes).map(([dim, c]: [string, any]) => {
  if (!c || c.delta === null) return '';
  const label = dim === 'overall'  ? 'Genel'
              : dim === 'mental'   ? 'Zihinsel'
              : dim === 'physical' ? 'Fiziksel'
              : dim === 'social'   ? 'Sosyal'
              : dim === 'financial'? 'Finansal'
              : 'İş & Anlam';
  const trendDesc = c.trend === 'up'   ? `▲ +${c.delta} puan artış`
              : c.trend === 'down' ? `▼ ${c.delta} puan düşüş`
              : '→ Stabil';
  return `${label}: ${c.current} (${trendDesc}, önceki dönem: ${c.previous})`;
}).filter(Boolean).join('\n')}

Raporda "TREND ANALİZİ" başlığı altında:
- Hangi boyutlar iyileşti, hangisi geriledi?
- En hızlı düşen boyutu özellikle vurgula
- En hızlı yükselen boyutu tebrikle
- Trend sürdürülebilir mi? Yorum yap.
` : `
## DÖNEMSEL TREND
İlk ölçüm dönemi. Trend analizi bir sonraki dönemde yapılacak.
Mevcut dönemi referans nokta (baseline) olarak değerlendir.
`;

    const prompt = `
${methodologySection}
${trendSection}

## ŞİRKET BİLGİSİ
- Şirket: ${company.name}
- Sektör: ${industry}
- Dönem: ${params.period}

Raporu ${langName} dilinde yaz. Resmi ama anlaşılır bir dil kullan.

## MEVCUT DÖNEM SKORLARI (0-100)
${scoreTable}

## DEPARTMAN SKORLARI
${deptTable || 'Departman bazlı veri bulunmuyor'}

## RİSK ALANLARI (45 puan altı)
${riskAreas.length > 0
  ? riskAreas.map((r: any) => `- ${r.dimension}: ${Number(r.score).toFixed(1)}`).join('\n')
  : 'Risk alanı bulunmuyor'}

---

Raporu aşağıdaki bölümlerle yaz. Her bölüm başlığını ## ile işaretle.

## YÖNETİCİ ÖZETİ
3-4 paragraf. Genel wellbeing durumunu özetle.
En önemli bulguları ve acil aksiyonları vurgula.
Güçlü ve zayıf yönleri dengeli şekilde sun.

## GENEL DEĞERLENDIRME
Şirketin genel wellbeing skorunu (overall) değerlendir.
Sektör ortalamasıyla karşılaştır.
Önceki dönemle kıyasla (trend).

## 5 BOYUT ANALİZİ

### Zihinsel Wellbeing (Mental)
Skoru değerlendir, nedenleri analiz et, öneriler sun.

### Fiziksel Wellbeing (Physical)
Skoru değerlendir, nedenleri analiz et, öneriler sun.

### Sosyal Wellbeing (Social)
Skoru değerlendir, nedenleri analiz et, öneriler sun.

### Finansal Wellbeing (Financial)
Skoru değerlendir, nedenleri analiz et, öneriler sun.

### İş & Anlam Wellbeing (Work)
Skoru değerlendir, nedenleri analiz et, öneriler sun.

## DEPARTMAN KARŞILAŞTIRMASI
En iyi ve en kötü performans gösteren departmanları belirle.
Departmanlar arası farkların olası nedenlerini açıkla.
Özellikle dikkat gereken departmanları vurgula.

## SEKTÖREL BENCHMARK KARŞILAŞTIRMASI
${company.name}'i ${industry} sektörü Türkiye ortalamasıyla karşılaştır.
Hangi boyutlarda sektörün üstünde/altında olduğunu açıkla.

## TREND ANALİZİ
Önceki dönemle karşılaştır.
İyileşen ve kötüleşen boyutları belirle.
Değişimlerin olası nedenlerini açıkla.

## RİSK ANALİZİ
Kritik risk alanlarını (45 puan altı) detaylı incele.
Her risk alanı için:
- Mevcut durum
- Olası nedenler  
- Kısa vadeli önlemler
- Uzun vadeli stratejiler

## AKSİYON PLANI
Öncelik sırasına göre 5-7 somut, uygulanabilir aksiyon öner.
Her aksiyon için:
- Ne yapılacak
- Sorumlu taraf (İK/Yönetim/Tüm çalışanlar)
- Zaman çerçevesi (1 ay / 3 ay / 6 ay)
- Beklenen etki

## SONUÇ
Raporu 2-3 paragrafla kapat.
Genel mesajı ve öncelikleri özetle.
Danışman tavsiyesini ekle.

---
NOT: Her bölüm en az 2-3 paragraf olsun. Gerçekçi, veri destekli,
profesyonel bir dil kullan. Klişelerden kaçın. Şirkete özel içerik üret.
`;

    // ── 3. AI ÇAĞRISI ────────────────────────────────────────────

    const reportContent = await this.aiService.generateLongForm(
      prompt,
      params.consultantId,
      {
        taskType:     'intelligence_report',
        creditAmount: 20,  // kapsamlı rapor — 20 AI kredisi
      }
    );

    return reportContent;
  }

  async generateAndSaveComprehensiveReport(params: {
    reportId?:    string;
    companyId:    string;
    consultantId: string;
    period:       string;
    language:     'tr' | 'en';
    assessmentModel?: string;
    referenceModel?:  string;
  }) {
    this.logger.log(`Starting background report generation for ${params.companyId} / ${params.period}`);
    
    try {
      let reportId = params.reportId;
      const company = await this.companyRepo.findOne({ where: { id: params.companyId } });
      if (!company) throw new Error('Company not found');

      if (!reportId) {
        // 1. Create Placeholder Record if not provided
        const insertResult = await this.dataSource.query(`
          INSERT INTO consultant_reports (
            consultant_id, company_id, title, content, period, status, 
            assessment_model, reference_assessment_model,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, 'generating', $6, $7, NOW(), NOW()
          ) RETURNING id
        `, [
          params.consultantId,
          params.companyId,
          `${company.name} — ${params.period} Wellbeing Raporu`,
          '',
          params.period,
          params.assessmentModel || company.assessmentModel || 'wellbeing_metric',
          params.referenceModel || null
        ]);
        reportId = insertResult[0].id;
      }
      
      this.logger.log(`Using report record: ${reportId}`);

      // 2. Generate content (Long running)
      const content = await this.generateComprehensiveReport(params);

      // 3. Update Record
      await this.dataSource.query(`
        UPDATE consultant_reports 
        SET content = $1, summary = $2, status = 'draft', updated_at = NOW()
        WHERE id = $3
      `, [
        content,
        content.split('\n').slice(0, 3).join(' ').slice(0, 200),
        reportId
      ]);

      // Notify consultant
      const consultant = await this.dataSource.query(`SELECT email, full_name FROM users WHERE id = $1`, [params.consultantId]);
      if (consultant[0]) {
        await this.notificationService.sendEmail(consultant[0].email, 'consultant_report_ready', {
          consultant_name: consultant[0].full_name,
          company_name:    company.name,
          period:          params.period,
          report_url:      `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://wellbeingmetric.com'}/consultant/reports/${reportId}`
        });

        // In-app bildirim gönder
        await this.inAppNotifService.create({
          userId:  params.consultantId,
          type:    'ai_report_ready',
          titleTr: `Rapor hazır: ${company.name}`,
          titleEn: `Report ready: ${company.name}`,
          bodyTr:  'AI raporu oluşturuldu, inceleyebilirsiniz.',
          bodyEn:  'AI report generated, ready for review.',
          link:    `/consultant/reports`,
          metadata: { report_id: reportId, company_id: params.companyId },
        });
      }

      this.logger.log(`Background report generation completed: ${reportId}`);
    } catch (error) {
      this.logger.error(`Failed to generate background report: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getPrevPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }
}
