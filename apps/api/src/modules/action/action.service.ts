import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Action } from './entities/action.entity';
import { CreateActionDto, ActionStatus } from './dto/create-action.dto';
import { UpdateActionStatusDto } from './dto/update-action-status.dto';
import { ActionFilterDto } from './dto/action-filter.dto';
import { ContentItem } from '../content/entities/content-item.entity';
import { WellbeingScore } from '../score/entities/wellbeing-score.entity';
import { PlatformSettings } from '../settings/entities/platform-settings.entity';
import { AuditService } from '../audit/audit.service';
import { ContentService } from '../content/content.service';

@Injectable()
export class ActionService {
  constructor(
    @InjectRepository(Action)
    private readonly actionRepository: Repository<Action>,
    @InjectRepository(ContentItem)
    private readonly contentRepository: Repository<ContentItem>,
    @InjectRepository(WellbeingScore)
    private readonly scoreRepository: Repository<WellbeingScore>,
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
    private readonly auditService: AuditService,
    private readonly contentService: ContentService,
  ) {}

  async findAll(companyId: string, filters: ActionFilterDto) {
    const { status, dimension, department_id, page = 1, per_page = 50 } = filters;

    const query = this.actionRepository.createQueryBuilder('action')
      .leftJoinAndSelect('action.department', 'department')
      .leftJoinAndSelect('action.creator', 'creator')
      .leftJoinAndSelect('action.content_item', 'content_item')
      .where('action.company_id = :companyId', { companyId });

    if (status) query.andWhere('action.status = :status', { status });
    if (dimension) query.andWhere('action.dimension = :dimension', { dimension });
    if (department_id) query.andWhere('action.department_id = :department_id', { department_id });

    const [items, total] = await query
      .orderBy('action.created_at', 'DESC')
      .skip((page - 1) * per_page)
      .take(per_page)
      .getManyAndCount();

    // Map response to match requirements
    const mappedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      dimension: item.dimension,
      department: item.department ? { id: item.department.id, name: item.department.name } : null,
      status: item.status,
      due_date: item.due_date,
      created_by: item.creator ? { id: item.creator.id, full_name: item.creator.full_name } : null,
      content_item: item.content_item ? {
        id: item.content_item.id,
        title_tr: item.content_item.title_tr,
        title_en: item.content_item.title_en,
        url_tr: item.content_item.url_tr,
        url_en: item.content_item.url_en,
        type: item.content_item.type,
      } : null,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return {
      items: mappedItems,
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async findOne(id: string, companyId: string) {
    const action = await this.actionRepository.findOne({
      where: { id, company_id: companyId },
      relations: ['department', 'creator', 'content_item'],
    });

    if (!action) {
      throw new NotFoundException({
        code: 'ACTION_NOT_FOUND',
        message: 'Aksiyon bulunamadı.',
      });
    }

    return action;
  }

  async create(companyId: string, createdBy: string, dto: CreateActionDto) {
    if (dto.content_item_id) {
      const content = await this.contentRepository.findOne({
        where: { id: dto.content_item_id, is_active: true },
      });
      if (!content) {
        throw new BadRequestException({
          code: 'INVALID_CONTENT',
          message: 'Geçersiz veya aktif olmayan içerik seçildi.',
        });
      }
    }

    const action = this.actionRepository.create({
      ...dto,
      company_id: companyId,
      created_by: createdBy,
    });

    const saved = await this.actionRepository.save(action);

    await this.auditService.logAction(
      createdBy,
      companyId,
      'action.create',
      'actions',
      saved.id,
      dto,
    );

    return saved;
  }

  async updateStatus(id: string, companyId: string, updatedBy: string, dto: UpdateActionStatusDto) {
    const action = await this.findOne(id, companyId);
    const oldStatus = action.status as ActionStatus;
    const newStatus = dto.status;

    // Transition rules
    const allowed = this.isTransitionAllowed(oldStatus, newStatus);
    if (!allowed) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Durum geçişi hatası: ${oldStatus} -> ${newStatus} yapılamaz.`,
      });
    }

    action.status = newStatus;
    action.updated_at = new Date();
    const updated = await this.actionRepository.save(action);

    await this.auditService.logAction(
      updatedBy,
      companyId,
      'action.status_change',
      'actions',
      id,
      { from: oldStatus, to: newStatus },
    );

    return updated;
  }

  private isTransitionAllowed(from: ActionStatus, to: ActionStatus): boolean {
    if (from === to) return true;
    if (from === ActionStatus.COMPLETED || from === ActionStatus.CANCELLED) return false;
    
    if (from === ActionStatus.PLANNED) {
      return [ActionStatus.IN_PROGRESS, ActionStatus.COMPLETED, ActionStatus.CANCELLED].includes(to);
    }
    
    if (from === ActionStatus.IN_PROGRESS) {
      return [ActionStatus.COMPLETED, ActionStatus.CANCELLED].includes(to);
    }

    return false;
  }

  async delete(id: string, companyId: string, deletedBy: string) {
    const action = await this.findOne(id, companyId);

    if (action.status !== ActionStatus.PLANNED) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Sadece planlanan (planned) durumdaki aksiyonlar silinebilir.',
      });
    }

    await this.actionRepository.delete(id);

    await this.auditService.logAction(
      deletedBy,
      companyId,
      'action.delete',
      'actions',
      id,
    );

    return { message: 'Aksiyon başarıyla silindi.' };
  }

  async getActionSuggestions(companyId: string, dimension: string, departmentId?: string, period?: string) {
    // 1. Get threshold from settings
    const settings = await this.settingsRepository.findOne({ order: { updated_at: 'DESC' } });
    const threshold = settings?.score_alert_threshold ?? 45;

    // 2. Get current score
    const scoreQuery = this.scoreRepository.createQueryBuilder('score')
      .where('score.company_id = :companyId', { companyId })
      .andWhere('score.dimension = :dimension', { dimension });

    if (period) {
      scoreQuery.andWhere('score.period = :period', { period });
    } else {
      scoreQuery.orderBy('score.period', 'DESC');
    }

    if (departmentId) {
      scoreQuery.andWhere('score.department_id = :departmentId', { departmentId });
    } else {
      scoreQuery.andWhere('score.department_id IS NULL');
    }

    const currentScoreEntry = await scoreQuery.getOne();
    const currentScore = currentScoreEntry?.score ? parseFloat(currentScoreEntry.score as any) : 100;

    // 3. Match content items
    const suggestedContent = await this.contentRepository.find({
      where: {
        dimension,
        score_threshold: In([null, ...Array.from({ length: 101 }, (_, i) => i).filter(v => v >= currentScore)]),
        is_active: true,
      },
      order: { score_threshold: 'ASC' },
      take: 5,
    });

    // TypeORM doesn't support easy "greater than or equal" in In, let's fix the where clause
    const contentQuery = this.contentRepository.createQueryBuilder('content')
      .where('content.dimension = :dimension', { dimension })
      .andWhere('content.is_active = true');
    
    if (currentScoreEntry) {
        contentQuery.andWhere('content.score_threshold >= :currentScore', { currentScore });
    }
    
    const finalSuggestedContent = await contentQuery.orderBy('content.score_threshold', 'ASC').take(5).getMany();

    // 4. Check existing actions
    const existingAction = await this.actionRepository.findOne({
      where: {
        company_id: companyId,
        dimension,
        department_id: departmentId || IsNull(),
        status: In([ActionStatus.PLANNED, ActionStatus.IN_PROGRESS]),
      },
    });

    return {
      dimension,
      current_score: currentScore,
      threshold,
      existing_action: !!existingAction,
      suggested_content: finalSuggestedContent.map(item => ({
        id: item.id,
        title_tr: item.title_tr,
        title_en: item.title_en,
        type: item.type,
        url_tr: item.url_tr,
        url_en: item.url_en,
        description_tr: item.description_tr,
        description_en: item.description_en,
      })),
    };
  }
}
