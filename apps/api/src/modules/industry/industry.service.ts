import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Industry } from './entities/industry.entity';
import { CreateIndustryDto } from './dto/create-industry.dto';
import { UpdateIndustryDto } from './dto/update-industry.dto';
import { slugify } from '../../common/utils/slugify';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IndustryService {
  private readonly logger = new Logger(IndustryService.name);
  private readonly redis: Redis;
  private readonly CACHE_KEY = 'industries';

  constructor(
    @InjectRepository(Industry)
    private readonly industryRepository: Repository<Industry>,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async findAll(includeInactive = false) {
    const cacheKey = `${this.CACHE_KEY}:${includeInactive}`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Redis cache error (GET): ${error.message}`);
      // Fallback to DB
    }

    const query = this.industryRepository.createQueryBuilder('industry')
      .orderBy('industry.order_index', 'ASC')
      .addOrderBy('industry.label_tr', 'ASC');

    if (!includeInactive) {
      query.where('industry.is_active = :active', { active: true });
    }

    const industries = await query.getMany();
    
    try {
      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(industries), 'EX', 3600);
    } catch (error) {
      this.logger.warn(`Redis cache error (SET): ${error.message}`);
    }
    
    return industries;
  }

  async findOneBySlug(slug: string) {
    const industry = await this.industryRepository.findOne({ where: { slug } });
    if (!industry) {
      throw new NotFoundException(`Sektör bulunamadı: ${slug}`);
    }
    return industry;
  }

  async create(dto: CreateIndustryDto, userId: string) {
    let slug = slugify(dto.label_tr);
    
    // Check for unique slug and handle collisions
    let counter = 1;
    let finalSlug = slug;
    while (await this.industryRepository.findOne({ where: { slug: finalSlug } })) {
      counter++;
      finalSlug = `${slug}-${counter}`;
    }

    const industry = this.industryRepository.create({
      ...dto,
      slug: finalSlug,
      is_default: false,
    });

    const saved = await this.industryRepository.save(industry);
    await this.clearCache();
    
    await this.auditService.log({
      action: 'industry.create',
      targetType: 'industry',
      targetId: saved.id,
      userId,
      payload: saved,
      companyId: null,
    });

    return saved;
  }

  async update(slug: string, dto: UpdateIndustryDto, userId: string) {
    const industry = await this.findOneBySlug(slug);

    Object.assign(industry, dto);
    const saved = await this.industryRepository.save(industry);
    
    await this.clearCache();

    await this.auditService.log({
      action: 'industry.update',
      targetType: 'industry',
      targetId: saved.id,
      userId,
      payload: dto,
      companyId: null,
    });

    return saved;
  }

  async updateStatus(slug: string, isActive: boolean, userId: string) {
    const industry = await this.findOneBySlug(slug);

    if (industry.is_default && !isActive) {
      throw new BadRequestException('Varsayılan sektörler deaktive edilemez.');
    }

    industry.is_active = isActive;
    const saved = await this.industryRepository.save(industry);
    
    await this.clearCache();

    await this.auditService.log({
      action: 'industry.status_update',
      targetType: 'industry',
      targetId: saved.id,
      userId,
      payload: { is_active: isActive },
      companyId: null,
    });

    return saved;
  }

  async getLabel(slug: string, lang: 'tr' | 'en' = 'tr'): Promise<string> {
    const industries = await this.findAll(true);
    const industry = industries.find((i: Industry) => i.slug === slug);
    
    if (!industry) return slug;
    return lang === 'en' ? (industry.label_en || industry.label_tr) : industry.label_tr;
  }

  private async clearCache() {
    try {
      const keys = await this.redis.keys(`${this.CACHE_KEY}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Redis cache clear error: ${error.message}`);
    }
  }
}
