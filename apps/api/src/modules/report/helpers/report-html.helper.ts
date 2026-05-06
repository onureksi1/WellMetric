import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class ReportHtmlHelper {
  async generateIntelligencePdf(
    company: { name: string; logoUrl: string },
    period: string,
    report: any,
    language: string
  ): Promise<Buffer> {
    const html = this.buildIntelligenceHtml(company, period, report, language);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Wait for any charts if present (though intelligence report might not have them, good to be consistent)
      await page.waitForFunction('window.__chartsReady === true', { timeout: 60000 }).catch(() => {});

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildIntelligenceHtml(company: any, period: string, report: any, language: string): string {
    const content = typeof report === 'string' ? report : (report.content || JSON.stringify(report));
    const title = typeof report === 'object' && report.title ? report.title : (language === 'tr' ? 'Yapay Zeka Analiz Raporu' : 'AI Intelligence Report');
    const summary = typeof report === 'object' ? report.summary : '';

    // Markdown → HTML (improved)
    const markdownToHtml = (md: string) => {
      if (!md) return '';
      return md
        .replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>')
        .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
        .replace(/<\/ul>\s*<ul>/g, '') // Birleştir
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n/g, '<br/>')
        .replace(/(<br\/>){2,}/g, '</p><p>')
        .replace(/^(?!<[h|u|s|e|b])/gim, '<p>')
        .replace(/$/gim, '</p>')
        .replace(/<p><\/p>/g, '');
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #1D9E75;
              --secondary: #0F6E56;
              --text: #1D1D1B;
              --text-light: #666;
              --bg: #F8FFFE;
              --border: #E5F5EF;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Outfit', sans-serif; 
              color: var(--text); 
              line-height: 1.6;
              background: white;
            }
            .page {
              padding: 40px 60px;
              width: 210mm;
              min-height: 297mm;
              position: relative;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid var(--primary); 
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo { max-height: 45px; object-fit: contain; }
            .report-info { text-align: left; }
            .report-title { 
              color: var(--text); 
              font-size: 24px; 
              font-weight: 700; 
              margin-bottom: 4px;
            }
            .period { color: var(--primary); font-weight: 600; font-size: 14px; }
            
            .summary-box {
              background: var(--bg);
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 30px;
              border: 1px solid var(--border);
            }
            .summary-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: var(--secondary);
              margin-bottom: 8px;
            }
            .summary-text { font-size: 14px; color: var(--text-light); font-style: italic; }

            .content { font-size: 13px; text-align: justify; }
            .md-h1 { font-size: 20px; font-weight: 700; color: var(--secondary); margin: 24px 0 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
            .md-h2 { font-size: 17px; font-weight: 600; color: var(--primary); margin: 20px 0 10px; }
            .md-h3 { font-size: 15px; font-weight: 600; color: var(--text); margin: 16px 0 8px; }
            p { margin-bottom: 12px; }
            ul { margin-bottom: 12px; padding-left: 20px; }
            li { margin-bottom: 4px; }
            
            .footer {
              position: absolute;
              bottom: 40px;
              left: 60px;
              right: 60px;
              border-top: 1px solid var(--border);
              padding-top: 15px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: var(--text-light);
            }
            
            @page { size: A4; margin: 0; }
            @media print {
              .page { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="report-info">
                <div class="report-title">${title}</div>
                <div class="period">${company.name} • ${period}</div>
              </div>
              ${company.logoUrl ? `<img src="${company.logoUrl}" class="logo" />` : ''}
            </div>

            ${summary ? `
              <div class="summary-box">
                <div class="summary-label">${language === 'tr' ? 'YÖNETİCİ ÖZETİ' : 'EXECUTIVE SUMMARY'}</div>
                <div class="summary-text">${summary}</div>
              </div>
            ` : ''}

            <div class="content">
              ${markdownToHtml(content)}
            </div>

            <div class="footer">
              <div>WellAnalytics Intelligence Report • ${new Date().toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')}</div>
              <div>Confidential</div>
            </div>
          </div>
          <script>window.__chartsReady = true;</script>
        </body>
      </html>
    `;
  }


  async generatePdf(data: {
    // Firma bilgisi
    company_name:    string;
    company_industry: string;
    period:          string;
    language:        'tr' | 'en';

    // Marka
    brand_logo_url:      string;
    brand_name:          string;
    consultant_name:     string;
    consultant_logo_url?: string;
    is_white_label:      boolean;

    // Skorlar
    scores: Array<{
      dimension:    string;
      score:        number;
      benchmark:    number;
      prev_score:   number | null;
      label_tr:     string;
      label_en:     string;
    }>;

    // Departmanlar
    departments: Array<{
      name:  string;
      score: number;
      respondents: number;
    }>;

    // AI içerik
    ai_content: string; // markdown

    // İstatistikler
    total_respondents: number;
    response_rate:     number;
    risk_areas:        string[];

  }): Promise<Buffer> {

    const html = this.buildHtml(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(60000);
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Chart.js grafiklerinin render'lanması için bekle
      await page.waitForFunction(
        () => (window as any).__chartsReady === true,
        { timeout: 15000 }
      );

      const pdf = await page.pdf({
        format:            'A4',
        printBackground:   true,
        margin: {
          top:    '0',
          right:  '0',
          bottom: '0',
          left:   '0',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(data: any): string {
    const t     = data.language === 'en';
    const lang  = (tr: string, en: string) => t ? en : tr;

    // Skor rengi
    const scoreColor = (s: number) =>
      s >= 70 ? '#1D9E75' :
      s >= 50 ? '#F59E0B' : '#EF4444';

    // Dimension etiketleri
    const dimLabel = (dim: string) => ({
      overall:  lang('Genel',       'Overall'),
      mental:   lang('Zihinsel',    'Mental'),
      physical: lang('Fiziksel',    'Physical'),
      social:   lang('Sosyal',      'Social'),
      financial:lang('Finansal',    'Financial'),
      work:     lang('İş & Anlam',  'Work & Purpose'),
    }[dim] ?? dim);

    // Logo bölümü
    const logoHtml = data.is_white_label && data.consultant_logo_url
      ? `<img src="${data.consultant_logo_url}"
              style="height:40px;max-width:160px;
                     object-fit:contain;object-position:left;" />`
      : data.brand_logo_url
        ? `<img src="${data.brand_logo_url}"
                style="height:40px;max-width:160px;
                       object-fit:contain;object-position:left;" />`
        : `<span style="font-size:14px;font-weight:600;
                        color:#0F6E56;">${data.brand_name}</span>`;

    // Markdown → HTML (basit)
    const markdownToHtml = (md: string) =>
      md
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(?!<[h|u|b|l])/gm, '<p>')
        .replace(/(?<![>])$/gm, '</p>');

    // Chart.js verileri
    const radarLabels  = JSON.stringify(
      data.scores.filter(s => s.dimension !== 'overall')
        .map(s => dimLabel(s.dimension))
    );
    const radarScores  = JSON.stringify(
      data.scores.filter(s => s.dimension !== 'overall').map(s => s.score)
    );
    const radarBench   = JSON.stringify(
      data.scores.filter(s => s.dimension !== 'overall').map(s => s.benchmark)
    );

    const barLabels    = JSON.stringify(data.scores.map(s => dimLabel(s.dimension)));
    const barScores    = JSON.stringify(data.scores.map(s => s.score));
    const barBench     = JSON.stringify(data.scores.map(s => s.benchmark));
    const barPrev      = JSON.stringify(data.scores.map(s => s.prev_score ?? s.score));

    const deptLabels   = JSON.stringify(data.departments.map(d => d.name));
    const deptScores   = JSON.stringify(data.departments.map(d => d.score));
    const deptColors   = JSON.stringify(
      data.departments.map(d => scoreColor(d.score))
    );

    const overallScore = data.scores.find(s => s.dimension === 'overall');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif;
         font-size: 12px; color: #1a1a1a; }

  /* ── KAPAK SAYFASI ── */
  .cover {
    width: 210mm; height: 297mm;
    background: #EAF7F2;
    display: flex; flex-direction: column;
    padding: 0;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }
  .cover-top {
    background: #1D9E75;
    padding: 32px 40px 24px;
    color: white;
  }
  .cover-logo-row {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
  }
  .cover-consultant {
    font-size: 12px; opacity: .8;
  }
  .cover-body {
    padding: 32px 40px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center; /* ortala */
  }
  .cover-label {
    font-size: 11px; font-weight: 600;
    color: #0F6E56; letter-spacing: .1em;
    text-transform: uppercase; margin-bottom: 8px;
  }
  .cover-company {
    font-size: 36px; font-weight: 700;
    color: #0D1F1A; margin-bottom: 8px;
    line-height: 1.2;
  }
  .cover-title {
    font-size: 16px; color: #3D6B5E;
    margin-bottom: 32px;
  }
  .cover-badges {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .cover-badge {
    background: white; border: 1px solid #9FE1CB;
    color: #0F6E56; font-size: 11px; font-weight: 500;
    padding: 4px 12px; border-radius: 20px;
  }
  .cover-score-block {
    background: white; border-radius: 12px;
    padding: 24px 32px; display: inline-flex;
    align-items: center; gap: 24px;
    box-shadow: 0 2px 12px rgba(0,0,0,.08);
    margin-bottom: 32px;
  }
  .cover-score-num {
    font-size: 56px; font-weight: 700;
    line-height: 1;
  }
  .cover-score-label {
    font-size: 12px; color: #666;
    text-transform: uppercase; letter-spacing: .08em;
  }
  .cover-score-sub {
    font-size: 13px; color: #444; margin-top: 4px;
  }
  .cover-footer {
    padding: 20px 40px;
    border-top: 1px solid #C5E8DC;
    display: flex; justify-content: space-between;
    align-items: center; background: rgba(255,255,255,.6);
  }
  .cover-footer-text {
    font-size: 10px; color: #888;
  }

  /* ── İÇ SAYFALAR ── */
  .page {
    width: 210mm; min-height: 297mm;
    padding: 32px 40px;
    page-break-after: always;
  }
  .page-header {
    display: flex; justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #1D9E75;
    padding-bottom: 12px; margin-bottom: 24px;
  }
  .page-header-title {
    font-size: 18px; font-weight: 600; color: #0D1F1A;
  }
  .page-header-meta {
    font-size: 10px; color: #888;
  }
  .section { margin-bottom: 16px; } /* 28px'den küçült */
  .section-title {
    font-size: 13px; font-weight: 600;
    color: #0F6E56; text-transform: uppercase;
    letter-spacing: .07em; margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid #E5F5EF;
  }

  /* Metric kartlar */
  .metric-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 20px;
  }
  .metric-card {
    background: #F8FFFE; border: 1px solid #C5E8DC;
    border-radius: 8px; padding: 14px 16px;
  }
  .metric-label {
    font-size: 10px; color: #666;
    text-transform: uppercase; letter-spacing: .08em;
    margin-bottom: 4px;
  }
  .metric-value {
    font-size: 24px; font-weight: 700; line-height: 1;
    margin-bottom: 2px;
  }
  .metric-sub { font-size: 11px; color: #888; }

  /* Risk kutuları */
  .risk-box {
    border-radius: 8px; padding: 12px 16px;
    margin-bottom: 8px; display: flex; gap: 12px;
  }
  .risk-critical { background: #FEF2F2; border-left: 4px solid #EF4444; }
  .risk-medium   { background: #FFFBEB; border-left: 4px solid #F59E0B; }
  .risk-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
  .risk-desc  { font-size: 11px; color: #555; line-height: 1.5; }

  /* Aksiyon listesi */
  .action-item {
    display: flex; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid #F0F0F0;
    align-items: flex-start;
  }
  .action-num {
    width: 22px; height: 22px; border-radius: 50%;
    background: #E1F5EE; color: #0F6E56;
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center;
    justify-content: center; flex-shrink: 0;
  }
  .action-title { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
  .action-desc  { font-size: 11px; color: #555; line-height: 1.5; }
  .action-tags  { display: flex; gap: 6px; margin-top: 4px; }
  .tag {
    font-size: 10px; padding: 1px 7px;
    border-radius: 4px; font-weight: 500;
  }
  .tag-time { background: #FEF3C7; color: #92400E; }
  .tag-who  { background: #EFF6FF; color: #1E40AF; }

  /* AI içerik */
  .ai-content h1 { font-size:16px; font-weight:700; color:#0D1F1A;
                    margin:20px 0 8px; }
  .ai-content h2 { font-size:14px; font-weight:600; color:#0F6E56;
                    margin:16px 0 6px; border-bottom:1px solid #E5F5EF;
                    padding-bottom:4px; }
  .ai-content h3 { font-size:13px; font-weight:600; color:#1a1a1a;
                    margin:12px 0 4px; }
  .ai-content p  { font-size:11px; line-height:1.7; color:#333;
                    margin-bottom:8px; }
  .ai-content ul { padding-left:16px; margin-bottom:8px; }
  .ai-content li { font-size:11px; line-height:1.6; color:#333; margin-bottom:3px; }
  .ai-content blockquote {
    border-left:3px solid #1D9E75; padding:8px 12px;
    background:#F0FBF7; margin:8px 0;
    font-size:11px; color:#444; font-style:italic;
  }
  .ai-content strong { font-weight:600; }

  /* Grafik container */
  .chart-container {
    position: relative; width: 100%;
  }

  /* Sayfa sonu */
  @page { size: A4; margin: 0; }
  @media print {
    .page { page-break-after: always; }
    .cover { page-break-after: always; }
  }
</style>
</head>
<body>

<!-- ══════════════════ KAPAK SAYFASI ══════════════════ -->
<div class="cover">
  <div class="cover-top">
    <div class="cover-logo-row">
      <div>${logoHtml}</div>
      <div class="cover-consultant" style="color:white;opacity:.8;">
        ${data.consultant_name}
      </div>
    </div>
  </div>

  <div class="cover-body">
    <div class="cover-label">
      ${lang('Kurumsal Wellbeing Raporu', 'Corporate Wellbeing Report')}
    </div>
    <div class="cover-company">${data.company_name}</div>
    <div class="cover-title">
      ${data.period} · ${lang('Dönem Analizi', 'Period Analysis')}
    </div>

    <div class="cover-badges">
      <span class="cover-badge">${data.company_industry || lang('Genel Sektör','General Industry')}</span>
      <span class="cover-badge">${data.total_respondents} ${lang('Katılımcı','Respondents')}</span>
      <span class="cover-badge">${data.departments.length} ${lang('Departman','Department')}</span>
      <span class="cover-badge">${data.period}</span>
    </div>

    ${overallScore ? `
    <div class="cover-score-block">
      <div>
        <div class="cover-score-label">
          ${lang('Genel Wellbeing Skoru', 'Overall Wellbeing Score')}
        </div>
        <div class="cover-score-num"
             style="color:${scoreColor(overallScore.score)}">
          ${overallScore.score.toFixed(1)}
        </div>
        <div class="cover-score-sub">/100</div>
      </div>
      <div style="border-left:1px solid #E5F5EF;padding-left:24px;">
        <div class="cover-score-label">
          ${lang('Sektör Benchmark', 'Industry Benchmark')}
        </div>
        <div style="font-size:28px;font-weight:600;color:#888;">
          ${overallScore.benchmark.toFixed(1)}
        </div>
        <div class="cover-score-sub" style="color:${
          overallScore.score >= overallScore.benchmark ? '#1D9E75' : '#EF4444'
        }">
          ${overallScore.score >= overallScore.benchmark
            ? `▲ +${(overallScore.score - overallScore.benchmark).toFixed(1)} ${lang('üzerinde','above')}`
            : `▼ ${(overallScore.score - overallScore.benchmark).toFixed(1)} ${lang('altında','below')}`}
        </div>
      </div>
    </div>` : ''}
  </div>

  <div class="cover-footer">
    <div class="cover-footer-text">
      ${lang('Gizli — Sadece yetkili personel', 'Confidential — Authorized personnel only')}
    </div>
    <div class="cover-footer-text">
      ${lang('Hazırlanma tarihi','Prepared on')}:
      ${new Date().toLocaleDateString(data.language === 'tr' ? 'tr-TR' : 'en-US')}
    </div>
  </div>
</div>

<!-- ══════════════════ SAYFA 2: BOYUT ANALİZİ ══════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-title">
      ${lang('Boyut Analizi', 'Dimension Analysis')}
    </div>
    <div class="page-header-meta">
      ${data.company_name} · ${data.period}
    </div>
  </div>

  <!-- Metrik kartlar -->
  <div class="metric-grid">
    <div class="metric-card">
      <div class="metric-label">${lang('Genel Skor','Overall Score')}</div>
      <div class="metric-value"
           style="color:${scoreColor(overallScore?.score ?? 0)}">
        ${overallScore?.score.toFixed(1) ?? '-'}
      </div>
      <div class="metric-sub">/100</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">${lang('Katılımcı','Respondents')}</div>
      <div class="metric-value" style="color:#1D9E75">
        ${data.total_respondents}
      </div>
      <div class="metric-sub">${lang('çalışan','employees')}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">${lang('Risk Alanı','Risk Areas')}</div>
      <div class="metric-value"
           style="color:${data.risk_areas.length > 0 ? '#EF4444' : '#1D9E75'}">
        ${data.risk_areas.length}
      </div>
      <div class="metric-sub">
        ${data.risk_areas.length > 0
          ? lang('dikkat gerektiriyor','needs attention')
          : lang('risk yok','no risk')}
      </div>
    </div>
  </div>

  <!-- Bar Chart: Boyut Skorları vs Benchmark -->
  <div class="section">
    <div class="section-title">
      ${lang('6 Boyut Skor Karşılaştırması','6 Dimension Score Comparison')}
    </div>
    <div class="chart-container" style="height:240px;">
      <canvas id="barChart"></canvas>
    </div>
  </div>

  <!-- Radar Chart -->
  <div class="section">
    <div class="section-title">
      ${lang('Radar Analizi','Radar Analysis')}
    </div>
    <div style="display:flex;justify-content:center;">
      <div class="chart-container" style="height:260px;width:300px;">
        <canvas id="radarChart"></canvas>
      </div>
    </div>
  </div>
</div>

<!-- ══════════════════ SAYFA 3: DEPARTMAN ══════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-title">
      ${lang('Departman Karşılaştırması','Department Comparison')}
    </div>
    <div class="page-header-meta">
      ${data.company_name} · ${data.period}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      ${lang('Departman Wellbeing Skorları','Department Wellbeing Scores')}
    </div>
    <div class="chart-container" style="height:${Math.min(200, data.departments.length * 32)}px;">
      <canvas id="deptChart"></canvas>
    </div>
  </div>

  <!-- Departman tablosu -->
  <div class="section">
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead>
        <tr style="background:#F0FBF7;">
          <th style="padding:8px 10px;text-align:left;color:#0F6E56;
                     font-weight:600;border-bottom:2px solid #C5E8DC;">
            ${lang('Departman','Department')}
          </th>
          <th style="padding:8px 10px;text-align:center;color:#0F6E56;
                     font-weight:600;border-bottom:2px solid #C5E8DC;">
            ${lang('Skor','Score')}
          </th>
          <th style="padding:8px 10px;text-align:center;color:#0F6E56;
                     font-weight:600;border-bottom:2px solid #C5E8DC;">
            ${lang('Durum','Status')}
          </th>
          <th style="padding:8px 10px;text-align:center;color:#0F6E56;
                     font-weight:600;border-bottom:2px solid #C5E8DC;">
            ${lang('Katılımcı','Respondents')}
          </th>
        </tr>
      </thead>
      <tbody>
        ${data.departments.map((d, i) => `
          <tr style="background:${i % 2 === 0 ? 'white' : '#FAFAFA'};">
            <td style="padding:8px 10px;border-bottom:1px solid #F0F0F0;
                       font-weight:500;">
              ${d.name}
            </td>
            <td style="padding:8px 10px;text-align:center;
                       border-bottom:1px solid #F0F0F0;
                       font-weight:700;color:${scoreColor(d.score)};">
              ${d.score.toFixed(1)}
            </td>
            <td style="padding:8px 10px;text-align:center;
                       border-bottom:1px solid #F0F0F0;">
              <span style="padding:2px 8px;border-radius:20px;font-size:10px;
                           font-weight:600;
                           background:${d.score >= 70 ? '#E1F5EE' : d.score >= 50 ? '#FEF3C7' : '#FEF2F2'};
                           color:${scoreColor(d.score)};">
                ${d.score >= 70
                  ? lang('İyi','Good')
                  : d.score >= 50
                    ? lang('Orta','Medium')
                    : lang('Risk','Risk')}
              </span>
            </td>
            <td style="padding:8px 10px;text-align:center;
                       border-bottom:1px solid #F0F0F0;color:#666;">
              ${d.respondents}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</div>

<!-- ══════════════════ SAYFA 4: AI ANALİZ İÇERİĞİ ══════════════════ -->
<div class="page">
  <div class="page-header">
    <div class="page-header-title">
      ${lang('Detaylı AI Analizi','Detailed AI Analysis')}
    </div>
    <div class="page-header-meta">
      ${data.company_name} · ${data.period}
    </div>
  </div>

  <div class="ai-content">
    ${markdownToHtml(data.ai_content)}
  </div>
</div>

<!-- Chart.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
const barLabels  = ${barLabels};
const barScores  = ${barScores};
const barBench   = ${barBench};
const barPrev    = ${barPrev};
const radarLabels= ${radarLabels};
const radarScores= ${radarScores};
const radarBench = ${radarBench};
const deptLabels = ${deptLabels};
const deptScores = ${deptScores};
const deptColors = ${deptColors};

// ── Bar Chart ──
new Chart(document.getElementById('barChart'), {
  type: 'bar',
  data: {
    labels: barLabels,
    datasets: [
      {
        label: '${lang('Şirket Skoru','Company Score')}',
        data: barScores,
        backgroundColor: barScores.map(s =>
          s >= 70 ? 'rgba(29,158,117,0.85)' :
          s >= 50 ? 'rgba(245,158,11,0.85)' : 'rgba(239,68,68,0.85)'
        ),
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
      },
      {
        label: '${lang('Sektör Benchmark','Industry Benchmark')}',
        data: barBench,
        backgroundColor: 'rgba(136,135,128,0.25)',
        borderColor:     'rgba(136,135,128,0.6)',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
      },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position:'bottom' } },
    scales: {
      y: { min: 0, max: 100,
           grid: { color: 'rgba(0,0,0,0.05)' },
           ticks: { font: { size: 10 } } },
      x: { grid: { display: false },
           ticks: { font: { size: 10 } } },
    },
  },
});

// ── Radar Chart ──
new Chart(document.getElementById('radarChart'), {
  type: 'radar',
  data: {
    labels: radarLabels,
    datasets: [
      {
        label: '${lang('Şirket','Company')}',
        data: radarScores,
        borderColor:     '#1D9E75',
        backgroundColor: 'rgba(29,158,117,0.15)',
        borderWidth: 2,
        pointBackgroundColor: '#1D9E75',
        pointRadius: 3,
      },
      {
        label: '${lang('Benchmark','Benchmark')}',
        data: radarBench,
        borderColor:     'rgba(136,135,128,0.6)',
        backgroundColor: 'rgba(136,135,128,0.08)',
        borderWidth: 1.5,
        borderDash: [4,3],
        pointBackgroundColor: 'rgba(136,135,128,0.6)',
        pointRadius: 2,
      },
    ],
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position:'bottom' } },
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { stepSize: 20, font: { size: 9 } },
        grid:  { color: 'rgba(0,0,0,0.08)' },
        pointLabels: { font: { size: 10 } },
      },
    },
  },
});

// ── Departman Bar Chart ──
new Chart(document.getElementById('deptChart'), {
  type: 'bar',
  data: {
    labels: deptLabels,
    datasets: [{
      label: '${lang('Departman Skoru','Department Score')}',
      data:  deptScores,
      backgroundColor: deptColors,
      borderRadius: 4,
      borderSkipped: false,
      barThickness: 20,
    }],
  },
  options: {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { min: 0, max: 100,
           grid: { color: 'rgba(0,0,0,0.05)' },
           ticks: { font: { size: 10 } } },
      y: { grid: { display: false },
           ticks: { font: { size: 10 } } },
    },
  },
});

// Puppeteer için hazır sinyali
window.__chartsReady = true;
</script>
</body>
</html>`;
  }
}
