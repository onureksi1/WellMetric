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
  platform_logo: {
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
      case 'platform_logo':
        s3Key = `platform/logo/${uuid}.${ext}`;
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

    if (dto.context === 'platform_logo') {
      this.logger.log(`Confirming platform logo upload: ${dto.s3_key}`);
      await this.dataSource.transaction(async (manager) => {
        // Update new logo URL (full URL)
        const updateRes = await manager.query(`UPDATE platform_settings SET platform_logo_url = $1`, [cdnUrl]);
        this.logger.log(`Logo update result: ${JSON.stringify(updateRes)}`);
        
        // Audit log
        await manager.query(`
          INSERT INTO audit_logs (user_id, action, target_type, payload)
          VALUES ($1, 'settings.logo.update', 'platform_settings', $2)
        `, [null, JSON.stringify({ logo_url: cdnUrl, s3_key: dto.s3_key })]);
      });

      // Invalidate caches properly via service
      await this.settingsService.invalidateCache();
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
    const csvStr = buffer.toString('utf-8');
    const firstLine = csvStr.split('\n')[0];
    const semiCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const detectedDelimiter = semiCount > commaCount ? ';' : ',';

    const records = parse(csvStr, {
      columns: (header) => header.map(h => h.trim().toLowerCase().replace(/^\uFEFF/, '')),
      skip_empty_lines: true,
      trim: true,
      bom: true,
      delimiter: detectedDelimiter
    });

    const validRows: any[] = [];
    const errorRows: any[] = [];

    const seniorityEnum = ['junior', 'mid', 'senior', 'lead', 'manager'];
    const ageEnum = ['18-25', '26-35', '36-45', '46+'];
    const genderEnum = ['male', 'female', 'other', 'prefer_not'];

    for (let i = 0; i < records.length; i++) {
      const row = records[i] as any;
      const rowNum = i + 1;

      // Flexible mapping for common headers
      const email = (row.email || row['e-posta'] || row['eposta'] || row['mail'])?.trim().toLowerCase();
      const fullName = (row.full_name || row['ad soyad'] || row['isim'] || row['ad_soyad'])?.trim();
      const deptName = (row.department_name || row['departman'] || row['bolum'] || row['department'])?.trim();

      if (!email || !isEmail(email)) {
        errorRows.push({ row_number: rowNum, email: email || '-', reason: 'Geçersiz email formatı' });
        continue;
      }

      if (!fullName || !deptName) {
        errorRows.push({ row_number: rowNum, email: email, reason: 'İsim veya departman eksik' });
        continue;
      }

      const rowData = {
        ...row,
        email,
        full_name: fullName,
        department_name: deptName,
        seniority: (row.seniority || row['kıdem'] || row['kidem'])?.trim(),
        age_group: (row.age_group || row['yas_grubu'] || row['yaş grubu'])?.trim(),
        gender: (row.gender || row['cinsiyet'])?.trim(),
        language: (row.language || row['dil'] || 'tr').trim().toLowerCase(),
      };

      // Cleanup enums
      if (rowData.seniority && !seniorityEnum.includes(rowData.seniority.toLowerCase())) rowData.seniority = null;
      if (rowData.age_group && !ageEnum.includes(rowData.age_group)) rowData.age_group = null;
      if (rowData.gender && !genderEnum.includes(rowData.gender.toLowerCase())) rowData.gender = null;
      if (rowData.language && !['tr', 'en'].includes(rowData.language)) rowData.language = 'tr';

      validRows.push({
        ...rowData,
        seniority: rowData.seniority?.toLowerCase(),
        gender: rowData.gender?.toLowerCase(),
        language: rowData.language || 'tr',
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
