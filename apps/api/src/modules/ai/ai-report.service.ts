import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from '../company/entities/company.entity';
import { AIService } from './ai.service';
import { NotificationService } from '../notification/notification.service';
import { InAppNotificationService } from '../notification/in-app-notification.service';

@Injectable()
export class AIReportService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly aiService: AIService,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly inAppNotifService: InAppNotificationService,
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

    // Trend hesaplama
    const prevMap: Record<string, number> = {};
    for (const p of prevScores) {
      prevMap[p.dimension] = Number(p.score);
    }
    const trends = currentScores.map((s: any) => ({
      dimension: s.dimension,
      current:   Number(s.score),
      previous:  prevMap[s.dimension] ?? null,
      change:    prevMap[s.dimension]
        ? Number(s.score) - prevMap[s.dimension]
        : null,
    }));

    // ── 2. AI PROMPT ─────────────────────────────────────────────
    
    // ── Model tanımları ──────────────────────────────────────────
    const MODEL_DEFINITIONS: Record<string, {
      name:       string;
      framework:  string;
      dimensions: string[];
      terminology: string;
      analysis_note: string;
    }> = {
      wellbeing_metric: {
        name:      'WellBeing Metric Modeli',
        framework: 'WellBeing Metric Proprietary Framework',
        dimensions: [
          'Fiziksel Wellbeing',
          'Zihinsel Wellbeing',
          'Sosyal Wellbeing',
          'Finansal Wellbeing',
          'İş & Anlam Wellbeing',
        ],
        terminology: `
          Fiziksel: Beden sağlığı, hareket, uyku, beslenme, ergonomi
          Zihinsel: Ruh sağlığı, stres yönetimi, tükenmişlik, psikolojik güvenlik
          Sosyal: Aidiyet, ekip ilişkileri, sosyal bağ, iletişim kalitesi
          Finansal: Ekonomik güvenlik, maaş tatmini, geleceğe güven
          İş & Anlam: Bağlılık, amaç duygusu, büyüme, iş-yaşam dengesi
        `,
        analysis_note: `
          Her boyutu 0-100 skala üzerinden değerlendir.
          Güçlü (70+), Gelişime Açık (50-69), Risk (50 altı) olarak sınıflandır.
        `,
      },
      who5_gallup: {
        name:      'WHO-5 + Gallup Q12 Modeli',
        framework: 'WHO-5 Wellbeing Index (WHO, 1998) + Gallup Q12 Employee Engagement Survey',
        dimensions: [
          'Zihinsel Wellbeing (WHO-5)',
          'İş Bağlılığı (Gallup Q12)',
          'Amaç & Misyon',
          'Yönetim Desteği',
          'Büyüme & Gelişim',
        ],
        terminology: `
          WHO-5 boyutları: Neşe ve iyi ruh hali, Sakinlik ve rahatlık,
          Canlılık ve enerji, Dinç uyanma, Günlük ilgi ve merak
          
          Gallup Q12 boyutları: Beklenti netliği, Araç ve kaynak yeterliliği,
          Takdir ve tanınma, Misyon bağlılığı, Kariyer gelişimi,
          Görüş alınma, Bağlılık ve sahiplenme, Sosyal arkadaşlık,
          İlerleme takibi, Öğrenme fırsatları, En iyi yönleri kullanma
        `,
        analysis_note: `
          WHO-5 skorunu 0-100'e normalize et (ham skor 0-25 arasındaysa 4 ile çarp).
          Gallup Q12 için engaged/not engaged/actively disengaged sınıflandırması kullan.
          İki çerçeveyi birleştirerek hem klinik hem kurumsal perspektif sun.
        `,
      },
      perma: {
        name:      'PERMA Modeli',
        framework: 'Seligman, M.E.P. (2011). Flourish. New York: Free Press.',
        dimensions: [
          'P — Pozitif Duygu (Positive Emotion)',
          'E — Bağlılık (Engagement)',
          'R — İlişkiler (Relationships)',
          'M — Anlam (Meaning)',
          'A — Başarı (Achievement)',
        ],
        terminology: `
          P - Positive Emotion: Neşe, minnettarlık, umut, ilham, merak,
              sevgi, hayranlık — pozitif duygu oranı
          E - Engagement: Akış (flow) deneyimi, tam odaklanma,
              güçlü yönleri kullanma, derin bağlılık
          R - Relationships: Anlamlı ilişkiler, destek alma/verme,
              güven, sosyal bağ kalitesi
          M - Meaning: Kendinden büyük bir amaca hizmet,
              katkı duygusu, değer uyumu
          A - Achievement: Başarı, ustalık (mastery), hedef gerçekleştirme,
              öz-yeterlilik
        `,
        analysis_note: `
          Her PERMA boyutunu ayrı ayrı değerlendir.
          Flourishing (gelişim) ve Languishing (sönümleme) kavramlarını kullan.
          Seligman'ın pozitif psikoloji perspektifinden öneriler sun.
        `,
      },
      cipd: {
        name:      'CIPD İş Yeri Wellbeing Modeli',
        framework: 'CIPD Health and Wellbeing at Work Framework (CIPD, 2023)',
        dimensions: [
          'Fiziksel Sağlık',
          'Psikolojik Wellbeing',
          'İş-Yaşam Dengesi',
          'Sosyal Sermaye',
          'Finansal Güvenlik',
        ],
        terminology: `
          Fiziksel sağlık yönetimi, psikolojik güvenlik,
          esnek çalışma, sosyal sermaye,
          liderlik desteği, kariyer gelişimi
        `,
        analysis_note: `
          CIPD'nin "Good Work" (İyi İş) çerçevesini referans al.
          İşveren yükümlülükleri ve İK pratikleri perspektifinden değerlendir.
          UK CIPD standartlarına göre benchmark sun.
        `,
      },
    };

    const assessmentModel = params.assessmentModel ?? company.assessmentModel ?? 'wellbeing_metric';
    const modelDef = MODEL_DEFINITIONS[assessmentModel]
      ?? MODEL_DEFINITIONS['wellbeing_metric'];

    const methodologySection = `
## METODOLOJİ VE DEĞERLENDİRME ÇERÇEVESİ

Kullanılan Model: ${modelDef.name}
Akademik Referans: ${modelDef.framework}

Değerlendirme Boyutları:
${modelDef.dimensions.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Terminoloji ve Kavramsal Çerçeve:
${modelDef.terminology}

Analiz Notu:
${modelDef.analysis_note}

ÖNEMLİ KURALLAR:
1. Raporu YALNIZCA ${modelDef.name} terminolojisiyle yaz
2. Başlıklarda bu modelin boyut isimlerini kullan
3. Öneriler bu modelin perspektifinden olsun
4. Raporun SONUÇ bölümünün en sonuna şu cümleyi ekle:
   "Bu analiz ${modelDef.framework} çerçevesinde hazırlanmıştır."
`;

    const scoreTable = currentScores.map((s: any) => {
      const bench  = benchmarks.find((b: any) => b.dimension === s.dimension);
      const trend  = trends.find(t => t.dimension === s.dimension);
      const change = trend?.change !== null && trend?.change !== undefined
        ? (trend.change > 0 ? `+${trend.change.toFixed(1)}` : trend.change.toFixed(1))
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

    const prompt = `
${methodologySection}

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
    companyId:    string;
    consultantId: string;
    period:       string;
    language:     'tr' | 'en';
    assessmentModel?: string;
    referenceModel?:  string;
  }) {
    this.logger.log(`Starting background report generation for ${params.companyId} / ${params.period}`);
    
    try {
      const company = await this.companyRepo.findOne({ where: { id: params.companyId } });
      if (!company) throw new Error('Company not found');

      // 1. Create Placeholder Record
      const insertResult = await this.dataSource.query(`
        INSERT INTO consultant_reports (
          consultant_id, company_id, title, content, period, status, 
          assessment_model, reference_assessment_model,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, 'processing', $6, $7, NOW(), NOW()
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

      const reportId = insertResult[0].id;
      this.logger.log(`Created placeholder report: ${reportId}`);

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
