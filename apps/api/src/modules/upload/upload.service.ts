import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { isEmail } from 'class-validator';
import { DataSource } from 'typeorm';
import { StorageProviderFactory } from './providers/storage-provider.factory';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

const FILE_LIMITS = {
  logo: {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2097152, // 2MB
  },
  csv: {
    mimes: ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
    maxSize: 10485760, // 10MB
  },
  report: {
    mimes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxSize: 20971520, // 20MB
  },
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly providerFactory: StorageProviderFactory,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
    private readonly dataSource: DataSource,
  ) {}

  async getPresignedPutUrl(dto: PresignedUrlDto, companyId: string) {
    const limits = FILE_LIMITS[dto.file_type];
    
    if (dto.file_size > limits.maxSize) {
      throw new BadRequestException(`Dosya boyutu çok büyük. Maksimum: ${limits.maxSize / 1024 / 1024}MB`);
    }

    if (!limits.mimes.includes(dto.mime_type)) {
      throw new BadRequestException('Desteklenmeyen dosya tipi.');
    }

    const ext = dto.mime_type.split('/')[1].replace('vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx');
    const uuid = uuidv4();
    let s3Key = '';

    switch (dto.file_type) {
      case 'logo':
        s3Key = `logos/${companyId}/${uuid}.${ext}`;
        break;
      case 'csv':
        s3Key = `uploads/csv/${companyId}/${uuid}.csv`;
        break;
      case 'report':
        const period = dto.period || new Date().toISOString().slice(0, 7);
        s3Key = `reports/${companyId}/${period}/${uuid}.${ext}`;
        break;
    }

    const { provider } = await this.providerFactory.getProvider();
    const url = await provider.getPresignedPutUrl(s3Key, dto.mime_type, 900);

    return {
      presigned_url: url,
      s3_key: s3Key,
      expires_at: new Date(Date.now() + 900 * 1000).toISOString(),
      max_size_bytes: limits.maxSize,
    };
  }

  async confirmUpload(dto: ConfirmUploadDto, companyId: string) {
    const { provider } = await this.providerFactory.getProvider();
    const exists = await provider.objectExists(dto.s3_key);

    if (!exists) {
      throw new NotFoundException('Dosya depolama alanında bulunamadı.');
    }

    let cdnUrl = '';
    const settings = await this.settingsService.getSettings();

    if (settings.storage_endpoint && settings.storage_provider === 'cloudflare_r2') {
      cdnUrl = `${settings.storage_endpoint}/${dto.s3_key}`;
    } else {
      cdnUrl = await provider.getPresignedGetUrl(dto.s3_key, 3600); // 1 hour
    }

    if (dto.context === 'logo') {
      await this.dataSource.transaction(async (manager) => {
        // Get old logo
        const company = await manager.query(`SELECT logo_url FROM companies WHERE id = $1`, [companyId]);
        const oldKey = company[0]?.logo_url;

        // Update new logo
        await manager.query(`UPDATE companies SET logo_url = $1 WHERE id = $2`, [dto.s3_key, companyId]);

        // Delete old logo from storage
        if (oldKey && oldKey !== dto.s3_key) {
          try {
            await provider.deleteObject(oldKey);
          } catch (e) {
            this.logger.error(`Eski logo silinemedi: ${oldKey}`, e);
          }
        }
      });
    }

    if (dto.context === 'report') {
      await this.auditService.logAction(
        'system',
        companyId,
        'report.generated',
        'reports',
        dto.entity_id || undefined,
        { s3_key: dto.s3_key }
      );
    }

    return {
      cdn_url: cdnUrl,
      s3_key: dto.s3_key,
    };
  }

  async parseCsv(s3Key: string, companyId: string) {
    const { provider } = await this.providerFactory.getProvider();
    const buffer = await provider.getObject(s3Key);
    const content = buffer.toString('utf-8');

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });

    const validRows: any[] = [];
    const errorRows: any[] = [];

    const seniorityEnum = ['junior', 'mid', 'senior', 'lead', 'manager'];
    const ageEnum = ['18-25', '26-35', '36-45', '46+'];
    const genderEnum = ['male', 'female', 'other', 'prefer_not'];

    for (let i = 0; i < records.length; i++) {
      const row = records[i] as any;
      const rowNum = i + 1;

      if (!row.email || !isEmail(row.email)) {
        errorRows.push({ row_number: rowNum, email: row.email, reason: 'Geçersiz email formatı' });
        continue;
      }

      if (!row.full_name || !row.department_name) {
        errorRows.push({ row_number: rowNum, email: row.email, reason: 'İsim veya departman eksik' });
        continue;
      }

      // Cleanup enums
      if (row.seniority && !seniorityEnum.includes(row.seniority.toLowerCase())) row.seniority = null;
      if (row.age_group && !ageEnum.includes(row.age_group)) row.age_group = null;
      if (row.gender && !genderEnum.includes(row.gender.toLowerCase())) row.gender = null;
      if (row.language && !['tr', 'en'].includes(row.language.toLowerCase())) row.language = 'tr';

      validRows.push({
        ...row,
        seniority: row.seniority?.toLowerCase(),
        gender: row.gender?.toLowerCase(),
        language: row.language?.toLowerCase() || 'tr',
      });
    }

    return {
      valid_rows: validRows,
      error_rows: errorRows,
      total: records.length,
      valid_count: validRows.length,
      error_count: errorRows.length,
    };
  }

  async getSignedGetUrl(s3Key: string, expiresIn: number = 900) {
    const { provider } = await this.providerFactory.getProvider();
    return provider.getPresignedGetUrl(s3Key, expiresIn);
  }

  async deleteObject(s3Key: string) {
    const { provider } = await this.providerFactory.getProvider();
    await provider.deleteObject(s3Key);
  }

  async testConnection() {
    const start = Date.now();
    try {
      const { provider } = await this.providerFactory.getProvider();
      const testKey = `test/connection-test-${uuidv4()}.txt`;
      const body = Buffer.from('connection-test');

      await provider.putObject(testKey, body, 'text/plain');
      const exists = await provider.objectExists(testKey);
      await provider.deleteObject(testKey);

      return {
        success: exists,
        latency_ms: Date.now() - start,
      };
    } catch (e) {
      return {
        success: false,
        error: e.message,
      };
    }
  }

  async saveLocalMock(key: string, body: Buffer) {
    const { provider } = await this.providerFactory.getProvider();
    if (typeof (provider as any).putObject === 'function') {
      await (provider as any).putObject(key, body, 'application/octet-stream');
    }
  }

  async getLocalMock(key: string) {
    const { provider } = await this.providerFactory.getProvider();
    if (typeof (provider as any).getObject === 'function') {
      return await (provider as any).getObject(key);
    }
    throw new BadRequestException('Local storage not active');
  }

  async getProvider() {
    return this.providerFactory.getProvider();
  }
}
