import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultantPlan } from '../consultant/entities/consultant-plan.entity';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../upload/upload.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { StorageProviderFactory } from '../upload/providers/storage-provider.factory';

export interface WhiteLabelConfig {
  brand_name: string;
  brand_logo_url: string | null;
  brand_color: string;
  brand_favicon_url: string | null;
  custom_domain: string | null;
  is_active: boolean;
}

@Injectable()
export class WhiteLabelService {
  constructor(
    @InjectRepository(ConsultantPlan)
    private readonly planRepo: Repository<ConsultantPlan>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly uploadService: UploadService,
    private readonly providerFactory: StorageProviderFactory,
  ) {}

  async getConfig(consultantId: string): Promise<WhiteLabelConfig | null> {
    const cacheKey = `wl:${consultantId}`;
    const cached = await this.cacheManager.get<WhiteLabelConfig>(cacheKey);
    if (cached) return cached;

    const plan = await this.planRepo.findOne({
      where: { consultant_id: consultantId, is_active: true },
    });

    if (!plan?.white_label) return null;

    const config: WhiteLabelConfig = {
      brand_name:     plan.brandName ?? 'Wellbeing Platformu',
      brand_logo_url: plan.brandLogoUrl ?? null,
      brand_color:    plan.brandColor ?? '#6C3A8E',
      brand_favicon_url: plan.brandFaviconUrl ?? null,
      custom_domain:  plan.customDomain ?? null,
      is_active:      true,
    };

    await this.cacheManager.set(cacheKey, config, 3600);
    return config;
  }

  async getConsultantByDomain(domain: string): Promise<string | null> {
    const cacheKey = `wl:domain:${domain}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) return cached;

    const plan = await this.planRepo.findOne({
      where: { customDomain: domain, customDomainVerified: true },
    });

    if (!plan) return null;
    await this.cacheManager.set(cacheKey, plan.consultant_id, 3600);
    return plan.consultant_id;
  }

  async invalidateCache(consultantId: string, domain?: string) {
    await this.cacheManager.del(`wl:${consultantId}`);
    if (domain) await this.cacheManager.del(`wl:domain:${domain}`);
  }

  async uploadLogo(
    consultantId: string,
    file: Express.Multer.File,
    type: 'logo' | 'favicon',
  ): Promise<string> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Geçersiz dosya tipi. PNG, JPG, WebP veya SVG olmalı.');
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('Logo 2MB\'dan büyük olamaz.');
    }

    const key = `white-label/${consultantId}/${type}-${Date.now()}.${file.originalname.split('.').pop()}`;
    const { provider } = await this.providerFactory.getProvider();
    await provider.putObject(key, file.buffer, file.mimetype);
    
    // Get CDN URL or signed URL
    const url = await this.uploadService.getSignedGetUrl(key, 31536000); // 1 year

    const field = type === 'logo' ? 'brandLogoUrl' : 'brandFaviconUrl';
    await this.planRepo.update(
      { consultant_id: consultantId },
      { [field]: url },
    );

    await this.invalidateCache(consultantId);
    return url;
  }

  async updateBranding(consultantId: string, dto: UpdateBrandingDto) {
    if (dto.brand_color && !/^#[0-9A-Fa-f]{6}$/.test(dto.brand_color)) {
      throw new BadRequestException('Renk #RRGGBB formatında olmalı.');
    }

    await this.planRepo.update(
      { consultant_id: consultantId },
      {
        brandName:  dto.brand_name,
        brandColor: dto.brand_color,
      },
    );

    const plan = await this.planRepo.findOne({ where: { consultant_id: consultantId } });
    await this.invalidateCache(consultantId, plan?.customDomain);
    return { updated: true };
  }

  async verifyCustomDomain(consultantId: string, domain: string): Promise<boolean> {
    const plan = await this.planRepo.findOne({ where: { consultant_id: consultantId } });
    if (!plan) return false;
    
    const expectedToken = `wellbeing-verify=${plan.id.slice(0, 8)}`;

    try {
      const dns = require('dns').promises;
      const records = await dns.resolveTxt(domain);
      const flat = records.flat();
      const verified = flat.includes(expectedToken);

      if (verified) {
        await this.planRepo.update(
          { consultant_id: consultantId },
          { customDomain: domain, customDomainVerified: true },
        );
        await this.invalidateCache(consultantId, domain);
      }

      return verified;
    } catch (e) {
      return false;
    }
  }
}
