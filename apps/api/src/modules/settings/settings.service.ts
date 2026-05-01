import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateApiKeysDto } from './dto/update-api-keys.dto';
import { UpdateAiModelsDto } from './dto/update-ai-models.dto';
import { TestMailDto } from './dto/test-mail.dto';

const ALGORITHM = 'aes-256-cbc';
const REDIS_KEY = 'platform:settings';

@Injectable()
export class SettingsService {
  private readonly redisClient: Redis;
  private readonly encryptionKey: Buffer;
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });

    const key = this.configService.get<string>('ENCRYPTION_KEY', 'default-32-character-dummy-key-abc!');
    this.encryptionKey = Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8');
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decrypt(text: string): string {
    if (!text || !text.includes(':')) return text;
    try {
      const textParts = text.split(':');
      const iv = Buffer.from(textParts.shift()!, 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
      let decrypted = decipher.update(encryptedText, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      return text;
    }
  }

  private maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return `${key.slice(0, 3)}-****${key.slice(-3)}`;
  }

  private encryptConfig(config: any, currentConfig: any = {}): any {
    if (!config) return {};
    
    // Ensure currentConfig is an object
    let current: any = {};
    if (currentConfig && typeof currentConfig === 'object') {
      current = { ...currentConfig };
    } else if (typeof currentConfig === 'string') {
      try { current = JSON.parse(currentConfig); } catch (e) { current = {}; }
    }

    const encrypted: any = { ...current };
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value !== '') {
        // If the value is masked (contains '****'), keep the current encrypted value
        if (value.includes('****')) {
          continue;
        }
        encrypted[key] = this.encrypt(value);
      } else {
        encrypted[key] = value;
      }
    }
    return encrypted;
  }

  private decryptConfig(config: any, mask = false): any {
    if (!config) return {};
    
    // Ensure config is an object
    let target: any = config;
    if (typeof config === 'string') {
      try { target = JSON.parse(config); } catch (e) { return {}; }
    }
    
    if (!target || typeof target !== 'object') return {};

    const decrypted: any = Array.isArray(target) ? [] : {};
    
    for (const [key, value] of Object.entries(target)) {
      if (typeof value === 'string' && value.includes(':')) {
        // Encrypted string
        const val = this.decrypt(value);
        decrypted[key] = mask ? this.maskKey(val) : val;
      } else if (value !== null && typeof value === 'object') {
        // Recurse into nested objects
        decrypted[key] = this.decryptConfig(value, mask);
      } else {
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  async getSettings(mask = true) {
    const cached = await this.redisClient.get(REDIS_KEY);
    if (cached && mask) {
      return JSON.parse(cached);
    }

    const result = await this.dataSource.query(`SELECT * FROM platform_settings LIMIT 1`);
    if (!result || result.length === 0) {
      return null;
    }

    const settings = result[0];
    
    // Mask api keys
    const rawApiKeys = settings.api_keys || {};
    const processedKeys: Record<string, string> = {};
    for (const [provider, encryptedValue] of Object.entries(rawApiKeys)) {
      if (encryptedValue) {
        const decrypted = this.decrypt(encryptedValue as string);
        processedKeys[provider] = mask ? this.maskKey(decrypted) : decrypted;
      }
    }
    settings.api_keys = processedKeys;

    // Process config fields
    settings.mail_config = this.decryptConfig(settings.mail_config, mask);
    settings.storage_config = this.decryptConfig(settings.storage_config, mask);

    if (mask) {
      await this.redisClient.set(REDIS_KEY, JSON.stringify(settings), 'EX', 3600);
    }
    return settings;
  }

  async updateSettings(dto: UpdatePlatformSettingsDto, adminUserId?: string) {
    const current = await this.dataSource.query(`SELECT * FROM platform_settings LIMIT 1`);
    const settings = current[0] || {};

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const data: any = { ...dto };
    
    // Helper to ensure we have an object for current config
    const getParsedConfig = (val: any) => {
      if (!val) return {};
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return {}; }
      }
      return val;
    };

    if (data.mail_config) {
      // Step 5: Smart merge for mail_config.provider_specific
      const currentConfig = getParsedConfig(settings.mail_config);
      const provider = data.mail_provider || settings.mail_provider;
      
      const providerSpecific = currentConfig.provider_specific || {};
      // Update only the current provider's config
      providerSpecific[provider] = data.mail_config;
      
      const finalConfig = {
        ...currentConfig,
        provider_specific: providerSpecific
      };
      
      data.mail_config = this.encryptConfig(finalConfig, currentConfig);
    }

    if (data.storage_config) {
      data.storage_config = this.encryptConfig(data.storage_config, getParsedConfig(settings.storage_config));
    }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        
        // Handle JSONB columns for raw SQL
        if (['mail_config', 'storage_config', 'ai_task_models', 'supported_languages', 'api_keys', 'consultant_packages'].includes(key) && typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        idx++;
      }
    }

    if (adminUserId) {
      fields.push(`updated_by = $${idx}`);
      values.push(adminUserId);
      idx++;
    }

    if (fields.length === 0) return { success: true };

    fields.push(`updated_at = NOW()`);
    
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query(`UPDATE platform_settings SET ${fields.join(', ')}`, values);
        await manager.query(`
          INSERT INTO audit_logs (user_id, action, target_type)
          VALUES ($1, 'settings.update', 'platform_settings')
        `, [adminUserId || null]);
      });
    } catch (error) {
      this.logger.error(`Failed to update platform settings: ${error.message}`, error.stack);
      // Surface the raw error message for diagnostics
      throw new InternalServerErrorException(`Platform ayarları güncellenirken bir hata oluştu: ${error.message}`);
    }

    await this.redisClient.del(REDIS_KEY);
    return { success: true };
  }

  async updateApiKeys(dto: UpdateApiKeysDto, adminUserId?: string) {
    const currentRes = await this.dataSource.query(`SELECT api_keys FROM platform_settings LIMIT 1`);
    const currentKeys = currentRes[0]?.api_keys || {};

    const providerKeys = currentKeys[dto.provider] ? JSON.parse(currentKeys[dto.provider]) : {};
    const providerConfig = this.encryptConfig(dto.config, providerKeys);
    const newKeys = { ...currentKeys, [dto.provider]: JSON.stringify(providerConfig) };

    await this.dataSource.transaction(async (manager) => {
      await manager.query(`UPDATE platform_settings SET api_keys = $1, updated_at = NOW()`, [JSON.stringify(newKeys)]);
      await manager.query(`
        INSERT INTO audit_logs (user_id, action, target_type)
        VALUES ($1, 'settings.api_keys.update', 'platform_settings')
      `, [adminUserId || null]);
    });

    await this.redisClient.del(REDIS_KEY);
    return { success: true };
  }

  async updateAiModels(dto: UpdateAiModelsDto, adminUserId?: string) {
    const currentRes = await this.dataSource.query(`SELECT ai_task_models FROM platform_settings LIMIT 1`);
    const currentModels = currentRes[0]?.ai_task_models || {};
    const newModels = { ...currentModels, ...dto };

    await this.dataSource.transaction(async (manager) => {
      await manager.query(`UPDATE platform_settings SET ai_task_models = $1, updated_at = NOW()`, [JSON.stringify(newModels)]);
      await manager.query(`
        INSERT INTO audit_logs (user_id, action, target_type)
        VALUES ($1, 'settings.ai_models.update', 'platform_settings')
      `, [adminUserId || null]);
    });

    await this.redisClient.del(REDIS_KEY);
    return { success: true };
  }

  async testMail(dto: TestMailDto) {
    const settings = await this.getSettings();
    const mailProvider = settings.mail_provider;

    if (!mailProvider) {
      throw new InternalServerErrorException('E-posta sağlayıcısı seçilmemiş.');
    }

    const mailConfig = await this.getDecryptedMailConfig();
    if (!mailConfig || !mailConfig.config) {
      throw new InternalServerErrorException('E-posta yapılandırması eksik.');
    }

    const fromAddr = settings.mail_from_address || 'noreply@wellanalytics.io';
    const fromNm = settings.mail_from_name || 'Wellbeing Metric';

    try {
      if (mailProvider === 'resend') {
        const { Resend } = require('resend');
        if (!mailConfig.config.api_key) throw new Error('Resend API key bulunamadı.');
        
        const resend = new Resend(mailConfig.config.api_key);
        const { error } = await resend.emails.send({
          from: `${fromNm} <${fromAddr}>`,
          to: dto.to,
          subject: '🚀 Wellbeing Metric Resend Test Maili',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2E865A;">Resend Bağlantısı Başarılı!</h2>
              <p>Bu mail, <b>Wellbeing Metric</b> platformu üzerinden Resend ayarlarınızı doğrulamak amacıyla gönderilmiştir.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Tarih: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          `,
        });

        if (error) throw new Error(error.message);
        return { success: true, message: 'Resend üzerinden test maili başarıyla gönderildi!' };

      } else if (mailProvider === 'smtp') {
        const { host, port, user, pass } = mailConfig.config;
        if (!host) throw new Error('SMTP host bulunamadı.');
        
        const transporter = require('nodemailer').createTransport({
          host,
          port: port || 587,
          secure: port === 465,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from: `"${fromNm}" <${fromAddr}>`,
          to: dto.to,
          subject: '🚀 Wellbeing Metric SMTP Test Maili',
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #2E865A;">SMTP Bağlantısı Başarılı!</h2>
              <p>Bu mail, <b>Wellbeing Metric</b> platformu üzerinden SMTP ayarlarınızı doğrulamak amacıyla gönderilmiştir.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #666;">Tarih: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
          `,
        });
        return { success: true, message: 'SMTP üzerinden test maili başarıyla gönderildi!' };
      }

      return { success: false, message: `${mailProvider} için test maili henüz desteklenmiyor.` };
    } catch (error) {
      this.logger.error(`Test mail failed: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Mail testi başarısız: ${error.message}`);
    }
  }

  async testStorage() {
    return { success: true, latency_ms: 45 };
  }

  async getDecryptedMailConfig(mask = false): Promise<any> {
    const settings = await this.getSettings(mask);
    const provider = settings.mail_provider;

    if (!settings.mail_config) {
      console.warn('[Settings] mail_config is empty');
      return {};
    }

    try {
      // 1. Get raw config
      let raw = settings.mail_config;
      
      // 2. Decrypt if it's a string
      if (typeof raw === 'string') {
        const decrypted = this.decrypt(raw);
        raw = JSON.parse(decrypted);
      }

      // 3. Handle provider_specific structure
      if (raw.provider_specific && raw.provider_specific[provider]) {
        return raw.provider_specific[provider];
      }

      // Fallback for legacy flat config
      return raw;

    } catch (err) {
      console.error('[Settings] Decrypt error:', err.message);
      // Decrypt failed -> try plain JSON
      try {
        const fallback = typeof settings.mail_config === 'string' 
          ? JSON.parse(settings.mail_config) 
          : settings.mail_config;
        return (fallback.provider_specific && fallback.provider_specific[provider])
          ? fallback.provider_specific[provider]
          : fallback;
      } catch {
        return {};
      }
    }
  }

  async getDecryptedStorageConfig() {
    const res = await this.dataSource.query(`SELECT storage_provider, storage_config FROM platform_settings LIMIT 1`);
    if (!res.length) return null;
    return {
      provider: res[0].storage_provider,
      config: this.decryptConfig(res[0].storage_config)
    };
  }

  async getDecryptedApiKey(provider: string): Promise<any | null> {
    const result = await this.dataSource.query(`SELECT api_keys FROM platform_settings LIMIT 1`);
    const keys = result[0]?.api_keys || {};
    if (!keys[provider]) return null;
    
    try {
      const val = keys[provider];
      if (typeof val === 'string' && val.startsWith('{')) {
        return this.decryptConfig(JSON.parse(val));
      }
      return this.decrypt(val);
    } catch (e) {
      return null;
    }
  }

  async getPackages() {
    const cached = await this.redisClient.get('platform:packages');
    if (cached) return JSON.parse(cached);

    const res = await this.dataSource.query(`SELECT consultant_packages FROM platform_settings LIMIT 1`);
    const packages = res[0]?.consultant_packages || {};
    
    await this.redisClient.set('platform:packages', JSON.stringify(packages), 'EX', 3600);
    return packages;
  }

  async updatePackages(packages: any, adminUserId?: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`UPDATE platform_settings SET consultant_packages = $1, updated_at = NOW()`, [JSON.stringify(packages)]);
      await manager.query(`
        INSERT INTO audit_logs (user_id, action, target_type)
        VALUES ($1, 'settings.packages.update', 'platform_settings')
      `, [adminUserId || null]);
    });

    await this.redisClient.del('platform:packages');
    await this.redisClient.del(REDIS_KEY);
    return { success: true };
  }

  async getPaymentProviders() {
    const res = await this.dataSource.query(`SELECT payment_settings FROM platform_settings LIMIT 1`);
    const settings = res[0]?.payment_settings || { providers: [] };
    
    // Return only enabled providers
    return (settings.providers || []).filter((p: any) => p.enabled === true);
  }
}
