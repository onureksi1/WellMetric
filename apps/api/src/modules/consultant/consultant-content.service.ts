import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ContentItem } from '../content/entities/content-item.entity';
import { ContentAssignment } from '../content/entities/content-assignment.entity';
import { Company } from '../company/entities/company.entity';
import { Department } from '../department/entities/department.entity';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { AppLogger } from '../../common/logger/app-logger.service';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';
import { AssignContentDto } from './dto/assign-content.dto';
import { AIService } from '../ai/ai.service';
import { BillingService } from '../billing/services/billing.service';

@Injectable()
export class ConsultantContentService {
  constructor(
    @InjectRepository(ContentItem)
    private readonly contentRepo: Repository<ContentItem>,
    @InjectRepository(ContentAssignment)
    private readonly assignmentRepo: Repository<ContentAssignment>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Department)
    private readonly deptRepo: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly logger: AppLogger,
    private readonly aiService: AIService,
    private readonly billingService: BillingService,
    private readonly dataSource: DataSource,
  ) {}

  // ── AI Atama Önerisi ─────────────────────────────────────────────

  async suggestAssignments(
    contentItemId: string,
    consultantId:  string,
  ): Promise<{
    suggestions: Array<{
      company_id:   string;
      company_name: string;
      scores:       Record<string, number>;
      reason:       string;
      match_level:  'high' | 'medium' | 'low';
    }>;
    ai_comment:   string;
    credits_used: number;
  }> {
    this.logger.info('AI içerik atama önerisi başlatıldı', {
      service: 'ConsultantContentService'
    }, { contentItemId, consultantId });

    // 1. İçeriği getir
    const content = await this.contentRepo.findOne({
      where: { id: contentItemId }
    });
    if (!content) throw new NotFoundException('İçerik bulunamadı');

    // 2. Consultant'ın firmalarını getir
    const companies = await this.companyRepo.find({
      where: { consultant_id: consultantId, is_active: true },
    });
    if (companies.length === 0) {
      throw new BadRequestException('Aktif firma bulunamadı');
    }

    // 3. Her firmanın son wellbeing skorlarını getir
    const companyScores: Array<{
      company: any;
      scores:  Record<string, number>;
      matches: boolean;
    }> = [];

    for (const company of companies) {
      // Son dönem skorlarını çek
      const scores = await this.dataSource.query(`
        SELECT dimension, AVG(score) as score
        FROM wellbeing_scores
        WHERE company_id = $1
          AND calculated_at >= NOW() - INTERVAL '90 days'
        GROUP BY dimension
      `, [company.id]);

      const scoreMap: Record<string, number> = {};
      for (const s of scores) {
        scoreMap[s.dimension] = Math.round(Number(s.score) * 10) / 10;
      }

      // Eşik kontrolü — içeriğin score_threshold'una göre
      // Tüm boyutları analiz et
      const threshold   = content.score_threshold ?? 50;
      const dimension   = content.dimension;
      let matches       = false;

      if (dimension && scoreMap[dimension] !== undefined) {
        // İçeriğin boyutunda eşik altıysa uygun
        matches = scoreMap[dimension] < threshold;
      } else {
        // Boyut belirtilmemişse overall'a bak
        matches = (scoreMap['overall'] ?? 100) < threshold;
      }

      companyScores.push({ company, scores: scoreMap, matches });
    }

    // 4. Uygun firmaları belirle
    const suitable    = companyScores.filter(c => c.matches);
    const notSuitable = companyScores.filter(c => !c.matches);

    // 5. AI yorumu üret (Claude)
    // 2 AI kredisi harcır
    const creditCost = 2;
    await this.billingService.consumeCredits(
      consultantId, 'ai_credit', creditCost
    );

    const promptData = {
      content: {
        title:     content.title_tr,
        dimension: content.dimension,
        threshold: content.score_threshold,
        type:      content.type,
      },
      suitable_companies: suitable.map(c => ({
        name:   c.company.name,
        scores: c.scores,
      })),
      not_suitable: notSuitable.map(c => ({
        name:   c.company.name,
        scores: c.scores,
      })),
    };

    const aiPrompt = `
Sen bir wellbeing danışmanına yardım eden bir AI asistansın.
Danışmanın içerik kütüphanesindeki bir içeriği hangi firmalarına ataması 
gerektiği konusunda kısa, profesyonel bir öneri yaz.

İçerik bilgisi:
- Başlık: ${promptData.content.title}
- Boyut: ${promptData.content.dimension ?? 'Genel'}
- Tür: ${promptData.content.type}
- Eşik: Bu boyutu ${promptData.content.threshold ?? 50} puanın altında olan firmalara önerilir

Uygun firmalar (eşik altında):
${suitable.length > 0
  ? suitable.map(c =>
      `- ${c.company.name}: ${content.dimension ? 
        `${content.dimension} skoru ${c.scores[content.dimension!] ?? 'bilinmiyor'}` :
        `overall skoru ${c.scores['overall'] ?? 'bilinmiyor'}`}`
    ).join('\n')
  : 'Eşik altında firma bulunamadı'}

Uygun olmayan firmalar:
${notSuitable.length > 0
  ? notSuitable.map(c =>
      `- ${c.company.name}: skorlar yeterince iyi`
    ).join('\n')
  : 'Yok'}

Lütfen 2-3 cümlelik kısa, Türkçe bir öneri yaz. 
Hangi firmalara neden önerdiğini açıkla.
Çok teknik veya uzun olmasın. Doğal bir danışman diliyle yaz.
`;

    let aiComment = '';
    try {
      aiComment = await this.aiService.generateShortComment(
        aiPrompt, consultantId
      );
    } catch (err) {
      this.logger.error('AI yorum üretilemedi', {
        service: 'ConsultantContentService'
      }, err);
      aiComment = suitable.length > 0
        ? `${suitable.map(c => c.company.name).join(', ')} firmalarının ${content.dimension ?? 'genel'} skorları eşiğin altında olduğu için bu içerik onlara önerilmektedir.`
        : 'Şu an eşik altında firma bulunmamaktadır.';
    }

    // 6. Match level belirle
    const suggestions = suitable.map(c => {
      const score     = content.dimension
        ? c.scores[content.dimension] ?? 50
        : c.scores['overall'] ?? 50;
      const threshold = content.score_threshold ?? 50;
      const diff      = threshold - score;

      return {
        company_id:   c.company.id,
        company_name: c.company.name,
        scores:       c.scores,
        reason:       content.dimension
          ? `${content.dimension} skoru: ${score} (eşik: <${threshold})`
          : `Genel skor: ${score} (eşik: <${threshold})`,
        match_level: diff > 20
          ? 'high' as const
          : diff > 10
            ? 'medium' as const
            : 'low' as const,
      };
    });

    this.logger.info('AI atama önerisi tamamlandı', {
      service: 'ConsultantContentService'
    }, {
      contentId:    contentItemId,
      suggestions:  suggestions.length,
      creditsUsed:  creditCost,
    });

    return {
      suggestions,
      ai_comment:   aiComment,
      credits_used: creditCost,
    };
  }

  // Toplu atama — önerilen firmalara tek seferde ata
  async bulkAssign(
    contentItemId: string,
    companyIds:    string[],
    consultantId:  string,
    notes?:        string,
  ): Promise<{ assigned: number; skipped: number }> {
    this.logger.info('Toplu atama başlatıldı', {
      service: 'ConsultantContentService'
    }, { contentItemId, companyIds, consultantId });

    // Ownership kontrolü
    const content = await this.contentRepo.findOne({
      where: [
        { id: contentItemId, consultant_id: consultantId },
        { id: contentItemId, is_global: true },
      ]
    });
    if (!content) throw new NotFoundException('İçerik bulunamadı');

    let assigned = 0;
    let skipped  = 0;

    for (const companyId of companyIds) {
      try {
        // Firma consultant'a ait mi?
        const company = await this.companyRepo.findOne({
          where: { id: companyId, consultant_id: consultantId }
        });
        if (!company) { skipped++; continue; }

        // Zaten atanmış mı?
        const existing = await this.assignmentRepo.findOne({
          where: {
            content_item_id: contentItemId,
            company_id:      companyId,
            department_id:   null,
          }
        });
        if (existing) { skipped++; continue; }

        await this.assignmentRepo.save({
          content_item_id: contentItemId,
          consultant_id:   consultantId,
          company_id:      companyId,
          department_id:   null,
          notes:           notes ?? 'AI önerisiyle atandı',
          status:          'draft',
        });
        assigned++;
      } catch (err) {
        this.logger.error('Tekil atama hatası', {
          service: 'ConsultantContentService'
        }, { companyId, error: err.message });
        skipped++;
      }
    }

    return { assigned, skipped };
  }

  // ── İçerik CRUD ─────────────────────────────────────────────────

  async findAll(consultantId: string) {
    // Consultant'ın kendi içerikleri + admin'in global içerikleri
    return this.contentRepo.find({
      where: [
        { consultant_id: consultantId },
        { is_global: true, is_active: true },
      ],
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateContentItemDto, consultantId: string) {
    this.logger.info('İçerik oluşturuluyor', { service: 'ConsultantContentService', method: 'create', userId: consultantId }, { dto });

    const item = this.contentRepo.create({
      ...dto,
      consultant_id: consultantId,
      is_global: false,
      is_active: true,
      created_by: consultantId,
    });
    return this.contentRepo.save(item);
  }

  async update(id: string, dto: UpdateContentItemDto, consultantId: string) {
    const item = await this.contentRepo.findOne({
      where: { id, consultant_id: consultantId }
    });
    if (!item) throw new NotFoundException('İçerik bulunamadı');
    Object.assign(item, dto);
    return this.contentRepo.save(item);
  }

  async remove(id: string, consultantId: string) {
    const item = await this.contentRepo.findOne({
      where: { id, consultant_id: consultantId }
    });
    if (!item) throw new NotFoundException('İçerik bulunamadı');

    // Gönderilmiş ataması varsa silinemez
    const sentAssignment = await this.assignmentRepo.findOne({
      where: { content_item_id: id, status: 'sent' }
    });
    if (sentAssignment) {
      throw new ConflictException(
        'Gönderilmiş ataması olan içerik silinemez'
      );
    }

    await this.contentRepo.remove(item);
    return { deleted: true };
  }

  // ── Atama ────────────────────────────────────────────────────────

  async assign(dto: AssignContentDto, consultantId: string) {
    this.logger.info('İçerik atanıyor', { service: 'ConsultantContentService', method: 'assign', userId: consultantId }, { dto });

    // Ownership kontrolü
    const item = await this.contentRepo.findOne({
      where: [
        { id: dto.content_item_id, consultant_id: consultantId },
        { id: dto.content_item_id, is_global: true },
      ],
    });
    if (!item) throw new NotFoundException('İçerik bulunamadı');

    // Firma consultant'a ait mi?
    const company = await this.companyRepo.findOne({
      where: { id: dto.company_id, consultant_id: consultantId }
    });
    if (!company) throw new ForbiddenException('Bu firmaya erişim yetkiniz yok');

    // Departman bu firmaya ait mi?
    if (dto.department_id) {
      const dept = await this.deptRepo.findOne({
        where: { id: dto.department_id, company_id: dto.company_id }
      });
      if (!dept) throw new BadRequestException('Departman bu firmaya ait değil');
    }

    // Mevcut atama var mı?
    const existing = await this.assignmentRepo.findOne({
      where: {
        content_item_id: dto.content_item_id,
        company_id:      dto.company_id,
        department_id:   dto.department_id ?? null,
      }
    });
    if (existing) {
      // Var olan atamayı güncelle (draft'a al)
      if (existing.status === 'sent') {
        throw new ConflictException('Bu içerik zaten gönderildi');
      }
      Object.assign(existing, { notes: dto.notes, updated_at: new Date() });
      return this.assignmentRepo.save(existing);
    }

    const assignment = this.assignmentRepo.create({
      content_item_id: dto.content_item_id,
      consultant_id:   consultantId,
      company_id:      dto.company_id,
      department_id:   dto.department_id,
      notes:           dto.notes,
      status:          'draft',
    });
    return this.assignmentRepo.save(assignment);
  }

  // ── Gönder (HR'a mail) ────────────────────────────────────────────

  async send(assignmentId: string, consultantId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, consultant_id: consultantId },
      relations: ['content_item', 'company', 'department'],
    });

    if (!assignment) throw new NotFoundException('Atama bulunamadı');
    if (assignment.status === 'sent') {
      throw new ConflictException('Bu içerik zaten gönderildi');
    }

    // HR admin'leri bul
    const hrAdmins = await this.userRepo.find({
      where: {
        company_id: assignment.company_id,
        role:       'hr_admin',
        is_active:  true,
      }
    });

    if (hrAdmins.length === 0) {
      this.logger.warn('HR admin bulunamadı', {
        service: 'ConsultantContentService',
        companyId: assignment.company_id
      });
    }

    // Consultant bilgisi
    const consultant = await this.userRepo.findOne({
      where: { id: consultantId }
    });

    if (!consultant) throw new NotFoundException('Consultant bulunamadı');

    // Her HR admin'e mail gönder
    for (const hr of hrAdmins) {
      await this.notificationService.sendEmail(hr.email, 'content_shared', {
        hr_name:          hr.full_name,
        consultant_name:  consultant.full_name,
        content_title:    assignment.content_item.title_tr,
        content_type:     assignment.content_item.type,
        content_url:      assignment.content_item.url_tr,
        dimension:        assignment.content_item.dimension ?? '',
        company_name:     assignment.company.name,
        department_name:  assignment.department?.name ?? 'Tüm firma',
        notes:            assignment.notes ?? '',
        dashboard_url:    `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/content`,
        platform_url:     process.env.APP_URL || 'http://localhost:3000',
      });
    }

    // Atama güncelle
    await this.assignmentRepo.update(assignmentId, {
      status:  'sent',
      sent_at: new Date(),
      sent_by: consultantId,
    });

    this.logger.info('İçerik gönderildi', {
      service: 'ConsultantContentService',
      userId: consultantId,
      extra: { assignmentId }
    }, {
      hrCount: hrAdmins.length,
      company: assignment.company.name,
    });

    return { sent: true, recipients: hrAdmins.length };
  }

  // ── Atama listesi ─────────────────────────────────────────────────

  async findAssignments(consultantId: string, filters: {
    company_id?:   string;
    status?:       string;
  }) {
    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.content_item', 'ci')
      .leftJoinAndSelect('a.company',      'co')
      .leftJoinAndSelect('a.department',   'd')
      .where('a.consultant_id = :cid', { cid: consultantId })
      .orderBy('a.created_at', 'DESC');

    if (filters.company_id) {
      qb.andWhere('a.company_id = :compId', { compId: filters.company_id });
    }
    if (filters.status) {
      qb.andWhere('a.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async updateAssignment(id: string, dto: any, consultantId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id, consultant_id: consultantId }
    });

    if (!assignment) throw new NotFoundException('Atama bulunamadı');
    if (assignment.status === 'sent') {
      throw new ConflictException('Gönderilmiş atama düzenlenemez');
    }

    Object.assign(assignment, {
      ...dto,
      updated_at: new Date()
    });
    return this.assignmentRepo.save(assignment);
  }

  async removeAssignment(id: string, consultantId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id, consultant_id: consultantId }
    });

    if (!assignment) throw new NotFoundException('Atama bulunamadı');
    if (assignment.status === 'sent') {
      throw new ConflictException('Gönderilmiş atama silinemez');
    }

    await this.assignmentRepo.remove(assignment);
    return { deleted: true };
  }
}
