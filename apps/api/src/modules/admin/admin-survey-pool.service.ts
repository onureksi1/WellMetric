import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from '../survey/entities/survey.entity';
import { User } from '../user/entities/user.entity';
import { SurveyPoolFilterDto } from './dto/survey-pool-filter.dto';

@Injectable()
export class AdminSurveyPoolService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async findAll(filters: SurveyPoolFilterDto) {
    const qb = this.surveyRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.created_by_user', 'u')
      .leftJoinAndSelect('s.questions', 'q')
      .leftJoinAndSelect('s.company', 'co')
      .where('s.type = :type', { type: 'company_specific' })
      .andWhere('s.isPoolVisible = true')
      .andWhere('s.created_by IS NOT NULL')
      .orderBy('s.poolAddedAt', 'DESC');

    // Filtreler
    if (filters.consultant_id) {
      qb.andWhere('s.created_by = :cid', { cid: filters.consultant_id });
    }
    if (filters.industry) {
      qb.andWhere('co.industry = :industry', { industry: filters.industry });
    }
    if (filters.dimension) {
      qb.andWhere('q.dimension = :dim', { dim: filters.dimension });
    }
    if (filters.date_from) {
      qb.andWhere('s.poolAddedAt >= :from', { from: filters.date_from });
    }

    const [data, total] = await qb
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    const mappedData = data.map(survey => ({
      ...survey,
      pool_added_at: survey.poolAddedAt
    }));

    return { data: mappedData, total, page: filters.page, limit: filters.limit };
  }

  async findOne(id: string) {
    // Soru detayları dahil — salt okunur
    return this.surveyRepo.findOne({
      where: {
        id,
        type: 'company_specific',
        isPoolVisible: true,
      },
      relations: [
        'questions',
        'questions.options',
        'questions.rows',
        'created_by_user',        // eğitmen
        'company',                // firma → sektör için
      ],
    });
  }

  // AI eğitimi için export
  // Sadece soru yapısı — hiçbir kişisel/firma verisi yok
  async exportForAI(filters: SurveyPoolFilterDto) {
    const { data } = await this.findAll({ ...filters, limit: 9999, page: 1 });

    const result = [];
    for (const survey of data) {
      const full = await this.findOne(survey.id);
      result.push({
        survey_id:        survey.id,
        title_tr:         survey.title_tr,
        title_en:         survey.title_en ?? null,
        industry:         full?.company?.industry ?? null,
        consultant_name:  full?.created_by_user?.full_name ?? null,
        pool_added_at:    survey.poolAddedAt,
        questions: (full?.questions ?? []).map(q => ({
          order_index:   q.order_index,
          dimension:     q.dimension,
          question_type: q.question_type,
          is_reversed:   q.is_reversed,
          weight:        q.weight,
          text_tr:       q.question_text_tr,
          text_en:       q.question_text_en ?? null,
          // Seçenekler (single_choice, multi_choice vb.)
          options: q.options?.map(o => ({
            label_tr: o.label_tr,
            label_en: o.label_en ?? null,
            value:    o.value,
          })) ?? [],
          // Matrix satırları
          rows: q.rows?.map(r => ({
            label_tr:  r.label_tr,
            label_en:  r.label_en ?? null,
            dimension: r.dimension,
          })) ?? [],
        })),
      });
    }

    return result;
    // NOT: Cevap, skor, firma_adı, çalışan, email — HİÇBİRİ gitmez
  }

  // Toplam istatistikler — dashboard kartları için
  async getStats() {
    const total = await this.surveyRepo.count({
      where: { type: 'company_specific', isPoolVisible: true },
    });

    const byIndustry = await this.surveyRepo
      .createQueryBuilder('s')
      .leftJoin('s.company', 'c')
      .select('c.industry', 'industry')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.type = :t', { t: 'company_specific' })
      .andWhere('s.is_pool_visible = true')
      .groupBy('c.industry')
      .getRawMany();

    const byConsultant = await this.surveyRepo
      .createQueryBuilder('s')
      .leftJoin('s.created_by_user', 'u')
      .select('u.full_name', 'name')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.type = :t', { t: 'company_specific' })
      .andWhere('s.is_pool_visible = true')
      .groupBy('u.full_name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return { total, by_industry: byIndustry, top_consultants: byConsultant };
  }
}
