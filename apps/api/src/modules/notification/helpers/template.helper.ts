import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class TemplateHelper {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(TemplateHelper.name);
  private readonly templatesDir: string;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
    this.templatesDir = path.join(process.cwd(), 'src/modules/notification/templates');
  }

  async loadTemplate(templateName: string, language: string): Promise<string> {
    const cacheKey = `template:${templateName}:${language}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return cached;

    let filePath = path.join(this.templatesDir, language, `${templateName}.html`);
    
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Template ${templateName} not found in ${language}, falling back to TR`);
      filePath = path.join(this.templatesDir, 'tr', `${templateName}.html`);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Template ${templateName} not found`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    await this.redisClient.set(cacheKey, content, 'EX', 86400); // 24h
    return content;
  }

  renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeHtml(value);
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), escapedValue);
    }
    return rendered;
  }

  private escapeHtml(text: string): string {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
