import { Injectable, NotFoundException, Inject, forwardRef, ServiceUnavailableException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiInsight } from './entities/ai-insight.entity';
import { ApiCostService } from './api-cost.service';
import { AIProviderFactory, AITaskEnum } from './ai-provider.factory';
import { AuditService } from '../audit/audit.service';
import { ContentService } from '../content/content.service';
import { ScoreService } from '../score/score.service';
import { DataSource } from 'typeorm';
import { ContentItem } from '../content/entities/content-item.entity';
import { extractKeywords } from './helpers/keyword-extractor';
import { buildContextNarrative } from './helpers/context-narrative.builder';
import { ReportService } from '../report/report.service';
import { CreditService } from '../billing/services/credit.service';
import { SettingsService } from '../settings/settings.service';
import { Anonymizer } from '../../common/utils/anonymizer.util';
import { AppLogger } from '../../common/logger/app-logger.service';
import { ServiceDebugger } from '../../common/logger/debug.helper';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const TASK_CREDITS: Record<string, number> = {
  'intelligence_report':    20,
  'content_suggestion':      2,
  'comparative_analysis':    5,
  'score_analysis':          3,
  'survey_generation':       5,
  'insight_generation':      2,
  'chat':                    1,
  'onboarding_analysis':     3,
  'action_recommendation':   2,
  'open_text_summary':       3,
  'risk_alert':              3,
  'trend_analysis':          3,
};

@Injectable()
export class AIService {
  private readonly debug: ServiceDebugger;

  constructor(
    @InjectRepository(AiInsight)
    private readonly insightRepository: Repository<AiInsight>,
    private readonly providerFactory: AIProviderFactory,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => ContentService))
    private readonly contentService: ContentService,
    @Inject(forwardRef(() => ScoreService))
    private readonly scoreService: ScoreService,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
    private readonly settingsService: SettingsService,
    private readonly creditService: CreditService,
    private readonly apiCostService: ApiCostService,
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {
    this.debug = new ServiceDebugger(logger, 'AIService');
  }

  private async handleAiUsage(companyId: string | null, taskType: string): Promise<number> {
    if (!companyId) return 0;

    const settings = await this.settingsService.getSettings();
    const costs = settings.credit_costs || {};
    const taskCost = costs[taskType];

    let totalDeducted = 0;
    if (!taskCost) {
      totalDeducted = TASK_CREDITS[taskType] ?? 1;
    } else {
      totalDeducted = Object.values(taskCost).reduce((a: number, b: any) => a + Number(b), 0) as number;
    }

    // Find consultant for this company
    const company = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = company[0]?.consultant_id;

    if (!consultantId) return totalDeducted;

    const costToUse = taskCost || { ai_credit: totalDeducted };

    for (const [creditTypeKey, amount] of Object.entries(costToUse)) {
      await this.creditService.deductCredits(
        consultantId,
        creditTypeKey,
        amount as number,
        `AI Analiz: ${taskType}`,
        companyId
      );
    }

    return totalDeducted;
  }

  async generateOpenTextSummary(companyId: string, surveyId: string, period: string, language: string = 'tr') {
    // 1. Fetch open text answers
    const answers = await this.dataSource.query(
      `SELECT answer_text FROM response_answers ra
       JOIN survey_responses sr ON ra.response_id = sr.id
       WHERE sr.company_id = $1 AND sr.survey_id = $2 AND ra.answer_text IS NOT NULL AND ra.answer_text != ''
       AND EXISTS (SELECT 1 FROM survey_questions sq WHERE sq.id = ra.question_id AND sq.question_type = 'open_text')`,
      [companyId, surveyId],
    );

    const respondentCount = answers.length;

    // 2. Minimum 5 responses check
    if (respondentCount < 5) {
      await this.insightRepository.save({
        company_id: companyId,
        survey_id: surveyId,
        period,
        insight_type: 'open_text_summary',
        content: '',
        metadata: { reason: 'insufficient_data', respondent_count: respondentCount },
      });
      return;
    }

    // 3. Prepare prompts (Anonymize)
    const rawAnswers = answers.map((a: any) => a.answer_text).filter(Boolean);
    const safeAnswers = Anonymizer.anonymizeArray(rawAnswers);
    const answerList = safeAnswers.map(a => `- ${a}`).join('\n');
    
    await this.handleAiUsage(companyId, AITaskEnum.OPEN_TEXT_SUMMARY);

    const systemPrompt = language === 'tr' 
      ? 'Sen bir wellbeing analistisisin. Yalnızca verilen anonim verileri kullan. Türkçe yanıt ver.'
      : 'You are a wellbeing analyst. Only use the provided anonymous data. Respond in English.';
    
    const userPrompt = language === 'tr'
      ? `Aşağıdaki çalışan yorumlarını analiz et. Ortak temalar, sorunlar ve olumlu noktaları 3-5 madde halinde özetle.\nYorumlar:\n${answerList}`
      : `Analyze the following employee comments. Summarize common themes, issues, and positive points in 3-5 bullet points.\nComments:\n${answerList}`;

    // 4. Call AI
    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.OPEN_TEXT_SUMMARY);
    const result = await provider.complete(userPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    // 5. Save insight
    const saved = await this.insightRepository.save({
      company_id: companyId,
      survey_id: surveyId,
      period,
      insight_type: 'open_text_summary',
      content: result.response,
      metadata: {
        provider: (provider as any).constructor.name,
        model,
        tokens_used: result.totalTokens,
        duration_ms: result.durationMs,
        respondent_count: respondentCount,
      },
    });

    // 6. Cost log
    // Find consultantId for logging
    const companyInfo = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = companyInfo[0]?.consultant_id;

    await this.apiCostService.logAiCall({
      consultantId,
      companyId,
      taskType:     AITaskEnum.OPEN_TEXT_SUMMARY,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      aiInsightId:  saved.id,
      creditAmount: TASK_CREDITS[AITaskEnum.OPEN_TEXT_SUMMARY],
    });

    // 7. Audit log
    await this.auditService.logAction(
      'system',
      companyId,
      'ai.call',
      'ai_insights',
      saved.id,
      { task: AITaskEnum.OPEN_TEXT_SUMMARY, provider: (provider as any).constructor.name, model, tokens: result.totalTokens },
    );
  }

  async generateRiskAlert(companyId: string, departmentId: string | null, dimension: string, score: number, previousScore: number | null, period: string) {
    // Fetch department name if applicable
    let departmentName = 'Tüm Şirket';
    if (departmentId) {
      const dept = await this.dataSource.query(`SELECT name FROM departments WHERE id = $1`, [departmentId]);
      if (dept.length) departmentName = dept[0].name;
    }

    const systemPrompt = 'Sen bir wellbeing platform yöneticisisin.';
    const userPrompt = `${departmentName} ${dimension} boyutu skoru ${score}'e düştü. ${previousScore ? `Geçen dönem: ${previousScore}.` : ''} Olası nedenler ve İK yöneticisine 3 somut aksiyon öner.`;

    await this.handleAiUsage(companyId, AITaskEnum.RISK_ALERT);

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.RISK_ALERT);
    const result = await provider.complete(userPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    const saved = await this.insightRepository.save({
      company_id: companyId,
      department_id: departmentId,
      period,
      insight_type: 'risk_alert',
      content: result.response,
      metadata: {
        dimension,
        score,
        previous_score: previousScore,
        delta: previousScore ? score - previousScore : null,
        provider: (provider as any).constructor.name,
        model,
        tokens_used: result.totalTokens,
        duration_ms: result.durationMs,
      },
    });

    const companyInfo = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = companyInfo[0]?.consultant_id;

    await this.apiCostService.logAiCall({
      consultantId,
      companyId,
      taskType:     AITaskEnum.RISK_ALERT,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      aiInsightId:  saved.id,
      creditAmount: TASK_CREDITS[AITaskEnum.RISK_ALERT],
    });

    await this.auditService.logAction(
      'system',
      companyId,
      'ai.call',
      'ai_insights',
      saved.id,
      { task: AITaskEnum.RISK_ALERT, provider: (provider as any).constructor.name, model, tokens: result.totalTokens },
    );
  }

  async generateActionSuggestion(companyId: string, dimension: string, score: number, departmentId?: string, period?: string, language: string = 'tr') {
    // Get department info
    let departmentName = 'Tüm Şirket';
    if (departmentId) {
      const dept = await this.dataSource.query(`SELECT name FROM departments WHERE id = $1`, [departmentId]);
      if (dept.length) departmentName = dept[0].name;
    }

    // Get company industry
    const company = await this.dataSource.query(`SELECT industry FROM companies WHERE id = $1`, [companyId]);
    const industry = company[0]?.industry || 'Genel';

    // Get content items
    const contentItems = await this.contentService.findByDimension(dimension, score, language);

    const systemPrompt = 'Sen bir wellbeing danışmanı olan bir AI asistanısın.';
    const userPrompt = `${departmentName} ${dimension} boyutu skoru ${score}. Sektör: ${industry}. Mevcut içerikler: ${JSON.stringify(contentItems.slice(0, 5))}. Bu duruma özel 3 aksiyon öner.`;

    const creditAmount = await this.handleAiUsage(companyId, AITaskEnum.ACTION_SUGGESTION);

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.ACTION_SUGGESTION);
    const result = await provider.complete(userPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    const companyInfo = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = companyInfo[0]?.consultant_id;

    await this.apiCostService.logAiCall({
      consultantId,
      companyId,
      taskType:     AITaskEnum.ACTION_SUGGESTION,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      creditAmount: creditAmount,
    });

    await this.auditService.logAction(
      'system',
      companyId,
      'ai.call',
      null,
      null,
      { task: AITaskEnum.ACTION_SUGGESTION, provider: (provider as any).constructor.name, model, tokens: result.totalTokens },
    );

    return {
      ai_suggestion: result.response,
      content_matches: contentItems.slice(0, 3),
    };
  }

  async generateComparativeInsight(options: { company_ids: string[]; period: string; consultant_id: string; language?: 'tr' | 'en' }) {
    const { company_ids, period, language = 'tr', consultant_id } = options;
    const ctx = { userId: consultant_id };

    this.debug.start('generateComparativeInsight', ctx, {
      company_count: company_ids.length,
      period,
    });

    try {
      // 1. Gather data from all companies
      const data = await this.dataSource.query(`
        SELECT c.name, ws.dimension, ws.score, ws.period
        FROM wellbeing_scores ws
        JOIN companies c ON c.id = ws.company_id
        WHERE ws.company_id = ANY($1) AND ws.period = $2
      `, [company_ids, period]);

      const prompt = language === 'tr' 
        ? `Bu firmaları karşılaştır: ${JSON.stringify(data)}. Hangisi en iyi? Ortak sorunlar? Öncelikli müdahale nerede?`
        : `Compare these firms: ${JSON.stringify(data)}. Which one is best? Common issues? Where is the priority intervention?`;
      
      this.debug.external('AI Provider', 'adminChat', ctx);
      const result = await this.adminChat(prompt, []);
      
      this.debug.done('generateComparativeInsight', ctx);
      return result;
    } catch (err) {
      this.debug.fail('generateComparativeInsight', ctx, err);
      throw err;
    }
  }

  async generateIntelligenceReport(companyId: string, period: string, language: 'tr' | 'en' = 'tr') {
    this.logger.log(`Generating intelligence report for company ${companyId}, period ${period}`);

    // 1. Data Collection
    const [year, month] = period.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    const prevPeriod = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const [
      scores,
      prevScores,
      departments,
      trend,
      benchmark,
      segSeniority,
      segLocation,
      participationRes,
      risks,
    ] = await Promise.all([
      this.scoreService.getCompanyScore(companyId, period),
      this.scoreService.getCompanyScore(companyId, prevPeriod),
      this.scoreService.getDepartmentScores(companyId, period),
      this.scoreService.getTrend(companyId, 6),
      this.scoreService.getBenchmark(companyId, period),
      this.scoreService.getSegmentScores(companyId, period, 'seniority'),
      this.scoreService.getSegmentScores(companyId, period, 'location'),
      this.dataSource.query(`SELECT COUNT(*) as total FROM survey_responses WHERE company_id = $1 AND period = $2`, [companyId, period]),
      this.dataSource.query(`SELECT * FROM ai_insights WHERE company_id = $1 AND period = $2 AND insight_type = 'risk_alert'`, [companyId, period]),
    ]);

    // 2. Open Text Summary & Keywords
    const openTextResult = await this.insightRepository.findOne({
      where: { company_id: companyId, period, insight_type: 'open_text_summary' }
    });

    const keywords = extractKeywords(openTextResult?.content || '');

    // 3. Build Narratives
    const narratives = buildContextNarrative({
      companyId,
      scores,
      prevScores,
      departments,
      segments: { seniority: segSeniority, location: segLocation },
      benchmark,
      openTextKeywords: keywords,
    }, language);

    // 4. AI Call
    const systemPrompt = language === 'tr'
      ? `Sen deneyimli bir organizasyonel psikoloji uzmanı ve wellbeing danışmanısın. Sana verilen anonim şirket verilerini analiz ederek kapsamlı bir wellbeing istihbarat raporu oluştur.
         KURALLAR:
         - Şirket adı veya ID asla kullanma
         - Sadece anonim istatistiksel veri kullan
         - Türkçe yaz
         - Somut, ölçülebilir öneriler ver
         - Genel tavsiyelerden kaçın — bu firmaya özel yaz
         - Her iddiayı veriyle destekle
         - Profesyonel ama anlaşılır dil kullan
         - "Genellikle...", "Çoğunlukla..." gibi muğlak ifadeler kullanma`
      : `You are an experienced organizational psychology expert and wellbeing consultant. Analyze the provided anonymous company data to create a comprehensive wellbeing intelligence report.
         RULES:
         - Never use company name or ID
         - Use only anonymous statistical data
         - Write in English
         - Give concrete, measurable recommendations
         - Avoid general advice — write specifically for this firm
         - Support every claim with data
         - Use professional but clear language
         - Do not use vague expressions like "Generally...", "Mostly..."`;

    const userPrompt = `
      DÖNEM: ${period}
      
      == HAM VERİ ==
      ${JSON.stringify({
        scores: { current: scores, previous: prevScores },
        trend,
        departments,
        segments: { seniority: segSeniority, location: segLocation },
        benchmark,
        participation: participationRes[0]?.total || 0,
        risks: risks.map((r: any) => ({ dimension: r.metadata?.dimension, score: r.metadata?.score })),
      }, null, 2)}
      
      == BAĞLAM (SİSTEM TESPİTLERİ) ==
      ${narratives.map((n, i) => `${i + 1}. ${n}`).join('\n')}
      
      == ÇALIŞAN SESİ ÖZETİ ==
      ${openTextResult?.content ?? 'Yeterli açık uçlu yanıt yok'}
      
      == GÖREV ==
      Yukarıdaki ham veriyi VE bağlam tespitlerini kullanarak belirtilen JSON formatında kapsamlı rapor oluştur. Sadece JSON döndür.
    `;

    await this.handleAiUsage(companyId, AITaskEnum.INTELLIGENCE_REPORT);

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.INTELLIGENCE_REPORT);
    const aiResult = await provider.complete(userPrompt, systemPrompt, 4000, 0.5, model, config);
    
    // 5. Parse JSON
    let report: any;
    try {
      const cleanJson = aiResult.response.replace(/```json|```/g, '').trim();
      report = JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Failed to parse AI Intelligence Report JSON', e);
      throw new Error('AI rapor formatı hatalı oluşturuldu, lütfen tekrar deneyin.');
    }

    // 6. Save Report
    const insight = await this.insightRepository.save({
      company_id: companyId,
      period,
      insight_type: 'intelligence_report',
      content: aiResult.response,
      metadata: {
        report,
        provider: (provider as any).constructor.name,
        model,
        tokens: aiResult.totalTokens,
      }
    });

    // 6. Cost Log
    const companyInfo = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = companyInfo[0]?.consultant_id;

    await this.apiCostService.logAiCall({
      consultantId,
      companyId,
      taskType:     AITaskEnum.INTELLIGENCE_REPORT,
      model,
      inputTokens:  aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      durationMs:   aiResult.durationMs,
      aiInsightId:  insight.id,
      creditAmount: TASK_CREDITS[AITaskEnum.INTELLIGENCE_REPORT],
    });

    // 7. Generate PDF
    await this.reportService.generateIntelligencePdf(companyId, period, report, language);

    return insight;
  }

  async generateTrendAnalysis(companyId: string, period: string, language: string = 'tr') {
    const trendData = await this.scoreService.getTrend(companyId, 6);
    
    const systemPrompt = 'Sen bir wellbeing analistisisin.';
    const userPrompt = `Son 6 aylık wellbeing trend verileri: ${JSON.stringify(trendData)}. En çok değişen 3 alan ve olası nedenleri analiz et. ${language === 'tr' ? 'Türkçe yanıt ver.' : 'Respond in English.'}`;

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.TREND_ANALYSIS);
    const result = await provider.complete(userPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    const saved = await this.insightRepository.save({
      company_id: companyId,
      period,
      insight_type: 'trend_analysis',
      content: result.response,
      metadata: {
        provider: (provider as any).constructor.name,
        model,
        tokens_used: result.totalTokens,
        duration_ms: result.durationMs,
      },
    });

    const companyInfo = await this.dataSource.query(`SELECT consultant_id FROM companies WHERE id = $1`, [companyId]);
    const consultantId = companyInfo[0]?.consultant_id;

    await this.apiCostService.logAiCall({
      consultantId,
      companyId,
      taskType:     AITaskEnum.TREND_ANALYSIS,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      aiInsightId:  saved.id,
      creditAmount: TASK_CREDITS[AITaskEnum.TREND_ANALYSIS],
    });

    await this.auditService.logAction(
      'system',
      companyId,
      'ai.call',
      'ai_insights',
      saved.id,
      { task: AITaskEnum.TREND_ANALYSIS, provider: (provider as any).constructor.name, model, tokens: result.totalTokens },
    );
  }

  async hrChat(companyId: string, message: string, conversationHistory: ChatMessage[], language: string = 'tr') {
    // Context preparation (anonymized)
    const latestScores = await this.scoreService.getCompanyScore(companyId, new Date().toISOString().slice(0, 7));
    const recentInsights = await this.insightRepository.find({
      where: { company_id: companyId },
      order: { generated_at: 'DESC' },
      take: 3
    });

    const safeMessage = Anonymizer.anonymize(message);
    const systemPrompt = `Sen bir wellbeing analistisisin. Yalnızca sana verilen anonim şirket verilerini kullan. Kişisel bilgi asla paylaşma. ${language === 'tr' ? 'Türkçe yanıt ver.' : 'Respond in English.'}`;
    const context = `Bağlam Verisi: Son Skorlar: ${JSON.stringify(latestScores)}. Son Analizler: ${recentInsights.map(i => i.content).join('\n')}`;
    const fullPrompt = `${context}\n\nGeçmiş:\n${conversationHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n')}\nUser: ${safeMessage}`;

    await this.handleAiUsage(companyId, AITaskEnum.HR_CHAT);

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.HR_CHAT);
    const result = await provider.complete(fullPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    await this.apiCostService.logAiCall({
      consultantId: null, // HR chat is currently not charged to consultant in this call
      companyId,
      taskType:     AITaskEnum.HR_CHAT,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      creditAmount: TASK_CREDITS[AITaskEnum.HR_CHAT],
    });

    return { response: result.response, tokens_used: result.totalTokens };
  }

  async adminAnomaly(period: string, language: string = 'tr') {
    // Fetch all company scores (anonymized)
    const allScores = await this.dataSource.query(
      `SELECT company_id, dimension, score FROM wellbeing_scores WHERE period = $1 AND department_id IS NULL AND segment_type IS NULL`,
      [period]
    );

    // Group and anonymize
    const companyMap = new Map<string, string>();
    let counter = 1;
    const anonymizedData = allScores.map((s: any) => {
      if (!companyMap.has(s.company_id)) companyMap.set(s.company_id, `Firma ${String.fromCharCode(64 + counter++)}`);
      return { company: companyMap.get(s.company_id), dimension: s.dimension, score: s.score };
    });

    // Calculate std dev (simple JS implementation)
    const scores = allScores.map((s: any) => parseFloat(s.score)).filter((s: any) => !isNaN(s));
    const mean = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(scores.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / scores.length);

    const systemPrompt = 'Sen bir platform analistisin.';
    const userPrompt = `Platform geneli wellbeing verileri: ${JSON.stringify(anonymizedData)}. Ortalama: ${mean.toFixed(2)}, Standart Sapma: ${stdDev.toFixed(2)}. Dikkat çeken örüntüler, anomaliler ve platform sağlığı hakkında 5 madde özetle. ${language === 'tr' ? 'Türkçe yanıt ver.' : 'Respond in English.'}`;

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.ADMIN_ANOMALY);
    const result = await provider.complete(userPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    await this.insightRepository.save({
      company_id: null,
      period,
      insight_type: 'admin_anomaly',
      content: result.response,
      metadata: { provider: (provider as any).constructor.name, model, mean, stdDev },
    });

    return { response: result.response };
  }

  async adminChat(message: string, conversationHistory: ChatMessage[], language: string = 'tr') {
    const systemPrompt = `Sen bir platform analistisin. Tüm firmaların anonim verilerini kullanarak genel trendler ve içgörüler sağla. Şirket ismi asla kullanma. ${language === 'tr' ? 'Türkçe yanıt ver.' : 'Respond in English.'}`;
    const fullPrompt = `Geçmiş:\n${conversationHistory.slice(-10).map(h => `${h.role}: ${h.content}`).join('\n')}\nUser: ${message}`;

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.ADMIN_CHAT);
    const result = await provider.complete(fullPrompt, systemPrompt, settings.ai_max_tokens, parseFloat(settings.ai_temperature), model, config);

    await this.insightRepository.save({
      company_id: null,
      insight_type: 'admin_chat',
      content: result.response,
      metadata: { provider: (provider as any).constructor.name, model },
    });

    return { response: result.response, tokens_used: result.totalTokens };
  }

  async generateSurveyQuestions(industry: string, dimensions: string[], questionCount: number, language: string = 'tr') {
    const systemPrompt = 'Sen bir wellbeing uzmanısın.';
    const userPrompt = `
      "${industry}" sektöründe çalışan bir şirket için ${dimensions.join(', ')} boyutlarını ölçen ${questionCount} adet soru öner. 
      JSON formatında döndür:
      [{
        "question_text_tr": string,
        "question_text_en": string,
        "dimension": string,
        "is_reversed": boolean,
        "question_type": "likert5"
      }]
      Sadece JSON döndür, başka metin ekleme.
    `;

    const { provider, model, config, settings } = await this.providerFactory.getProvider(AITaskEnum.SURVEY_GENERATION);
    const result = await provider.complete(userPrompt, systemPrompt, 2000, 0.7, model, config);

    try {
      // Find JSON array in response
      const match = result.response.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('AI did not return a valid JSON list');
      
      const questions = JSON.parse(match[0]);
      
      await this.auditService.logAction(
        'system',
        null,
        'ai.call',
        null,
        null,
        { task: AITaskEnum.SURVEY_GENERATION, provider: (provider as any).constructor.name, model, industry, question_count: questionCount },
      );

      return questions;
    } catch (e) {
      this.logger.error('Failed to parse AI survey questions', e);
      throw new ServiceUnavailableException('AI anket sorularını oluşturamadı, lütfen tekrar deneyin.');
    }
  }

  async getInsights(companyId: string | null, filters: any) {
    const { insight_type, period, department_id, page = 1, per_page = 20 } = filters;

    const query = this.insightRepository.createQueryBuilder('insight')
      .where('1=1');

    if (companyId) {
      query.andWhere('insight.company_id = :companyId', { companyId });
    } else {
      query.andWhere('insight.company_id IS NULL');
    }

    if (insight_type) query.andWhere('insight.insight_type = :insight_type', { insight_type });
    if (period) query.andWhere('insight.period = :period', { period });
    if (department_id) query.andWhere('insight.department_id = :department_id', { department_id });

    const [items, total] = await query
      .orderBy('insight.generated_at', 'DESC')
      .skip((page - 1) * per_page)
      .take(per_page)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async generateLongForm(
    prompt:       string,
    consultantId: string,
    options: {
      taskType:     string;
      creditAmount: number;
    }
  ): Promise<string> {
    const { provider, model, config, settings } = await this.providerFactory.getProvider(options.taskType as any);
    
    this.logger.debug(`[AIService] Generating long form for task: ${options.taskType} using model: ${model}`);
    this.logger.debug(`[AIService] Prompt length: ${prompt.length} chars`);

    // Kredi tüket
    await this.creditService.deductCredits(
      consultantId,
      'ai_credit',
      options.creditAmount,
      `Long Form AI: ${options.taskType}`,
    );

    const result = await provider.complete(
      prompt,
      'Sen profesyonel bir wellbeing danışmanısın.',
      4000, // maxTokens
      0.7,  // temperature
      model,
      config
    );

    // Log cost
    await this.apiCostService.logAiCall({
      consultantId,
      taskType:     options.taskType,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      creditAmount: options.creditAmount,
    });

    return result.response;
  }

  async generateBenchmarkSuggestions(industry: string, region: string, dimensions: string[]) {
    const { provider, model, config } = await this.providerFactory.getProvider(AITaskEnum.BENCHMARK_GENERATION);
    const prompt = `Sektör: ${industry}, Bölge: ${region}. Şu boyutlar için 0-100 arası gerçekçi wellbeing skorları öner: ${dimensions.join(', ')}. JSON formatında dön: { "suggestions": [ { "dimension": "...", "score": 75.5, "source": "..." } ] }`;
    
    const result = await provider.complete(prompt, 'Sen bir veri analistisin.', 1000, 0.3, model, config);
    return JSON.parse(result.response);
  }

  async generateShortComment(prompt: string, consultantId: string): Promise<string> {
    const { provider, model, config } = await this.providerFactory.getProvider(AITaskEnum.CONTENT_SUGGESTION);
    const result = await provider.complete(prompt, 'Sen bir danışmansın.', 500, 0.7, model, config);
    
    // Log call for cost tracking
    await this.apiCostService.logAiCall({
      consultantId,
      taskType:     AITaskEnum.CONTENT_SUGGESTION,
      model,
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
      creditAmount: TASK_CREDITS[AITaskEnum.CONTENT_SUGGESTION],
    });

    return result.response;
  }
}
