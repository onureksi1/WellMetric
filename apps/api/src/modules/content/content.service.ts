import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { ContentItem } from './entities/content-item.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentFilterDto } from './dto/content-filter.dto';
import { Action } from '../action/entities/action.entity';
import { ScoreService } from '../score/score.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentItem)
    private readonly contentRepository: Repository<ContentItem>,
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => ScoreService))
    private readonly scoreService: ScoreService,
  ) {}

  async findAll(filters: any, isAdmin: boolean = false, consultantId?: string) {
    const { type, dimension, is_active, page = 1, per_page = 50, search } = filters;

    const query = this.contentRepository.createQueryBuilder('content');

    if (type) query.andWhere('content.type = :type', { type });
    if (dimension) query.andWhere('content.dimension = :dimension', { dimension });
    if (consultantId) query.andWhere('content.consultant_id = :consultantId', { consultantId });
    
    if (search) {
      query.andWhere('(content.title_tr ILIKE :search OR content.title_en ILIKE :search)', { search: `%${search}%` });
    }

    if (!isAdmin && !consultantId) {
      query.andWhere('content.is_active = true');
    } else if (is_active !== undefined) {
      query.andWhere('content.is_active = :is_active', { is_active });
    }

    const [items, total] = await query
      .orderBy('content.created_at', 'DESC')
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

  async findOne(id: string) {
    const content = await this.contentRepository.findOne({ where: { id } });
    if (!content) {
      throw new NotFoundException({
        code: 'CONTENT_NOT_FOUND',
        message: 'İçerik bulunamadı.',
      });
    }
    return content;
  }

  async findByDimension(dimension: string, score: number, language: string = 'tr') {
    const items = await this.contentRepository.find({
      where: {
        dimension,
        score_threshold: LessThanOrEqual(score),
        is_active: true,
      },
      order: { score_threshold: 'ASC' },
    });

    return items.map((item) => ({
      id: item.id,
      title: language === 'en' ? item.title_en || item.title_tr : item.title_tr,
      description: language === 'en' ? item.description_en || item.description_tr : item.description_tr,
      type: item.type,
      url: language === 'en' ? item.url_en || item.url_tr : item.url_tr,
      score_threshold: item.score_threshold,
    }));
  }

  async create(dto: CreateContentDto, createdBy: string, consultantId?: string) {
    const content = this.contentRepository.create({
      ...dto,
      created_by: createdBy,
      consultant_id: consultantId,
    });

    const saved = await this.contentRepository.save(content);

    await this.auditService.logAction(
      createdBy,
      null,
      'content.create',
      'content_items',
      saved.id,
      dto,
    );

    return saved;
  }

  async update(id: string, dto: UpdateContentDto, updatedBy: string) {
    const content = await this.findOne(id);
    
    let warning: string | undefined;
    if (dto.is_active === false && content.is_active === true) {
      const activeActionsCount = await this.actionRepository.count({
        where: {
          content_item_id: id,
          status: In(['planned', 'in_progress']),
        },
      });
      if (activeActionsCount > 0) {
        warning = `${activeActionsCount} adet aksiyon bu içeriği kullanıyor`;
      }
    }

    Object.assign(content, dto);
    const updated = await this.contentRepository.save(content);

    await this.auditService.logAction(
      updatedBy,
      null,
      'content.update',
      'content_items',
      id,
      dto,
    );

    return warning ? { ...updated, warning } : updated;
  }

  async delete(id: string, deletedBy: string) {
    const content = await this.findOne(id);

    const hasActions = await this.actionRepository.count({
      where: { content_item_id: id },
    });

    if (hasActions > 0) {
      content.is_active = false;
      await this.contentRepository.save(content);
      await this.auditService.logAction(
        deletedBy,
        null,
        'content.soft_delete',
        'content_items',
        id,
      );
      return { message: 'İçerik bağlı aksiyonlar olduğu için pasif duruma getirildi.' };
    }

    await this.contentRepository.remove(content);
    await this.auditService.logAction(
      deletedBy,
      null,
      'content.delete',
      'content_items',
      id,
    );

    return { message: 'İçerik başarıyla silindi.' };
  }

  async getPersonalRecommendations(userId: string, language: string = 'tr') {
    // We need a way to get the latest survey response for the user to get their personal scores
    // For now, let's assume ScoreService.getPersonalScore can find it or we find the latest survey
    // Finding latest survey for company:
    const user = await this.contentRepository.manager.query(
      `SELECT company_id FROM users WHERE id = $1`, [userId]
    );
    if (!user.length) throw new NotFoundException('Kullanıcı bulunamadı.');
    
    const companyId = user[0].company_id;
    
    const latestSurvey = await this.contentRepository.manager.query(
      `SELECT id FROM surveys WHERE company_id = $1 OR company_id IS NULL ORDER BY created_at DESC LIMIT 1`,
      [companyId]
    );

    if (!latestSurvey.length) return [];

    const scores = await this.scoreService.getPersonalScore(userId, latestSurvey[0].id);
    if (!scores) return [];

    // Get lowest 2 dimensions (excluding overall)
    const dimensions = ['physical', 'mental', 'social', 'financial', 'work'];
    const sortedScores = dimensions
      .map(dim => ({ dimension: dim, score: scores[dim] ?? 100 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 2);

    const recommendations = [];
    for (const scoreObj of sortedScores) {
      const items = await this.findByDimension(scoreObj.dimension, scoreObj.score, language);
      recommendations.push({
        dimension: scoreObj.dimension,
        score: scoreObj.score,
        items: items.slice(0, 3),
      });
    }

    return recommendations;
  }
}
