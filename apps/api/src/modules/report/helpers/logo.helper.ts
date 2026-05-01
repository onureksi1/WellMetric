import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class LogoHelper {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(LogoHelper.name);

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async fetchLogoBuffer(logoUrl: string | null, companyId: string): Promise<Buffer | null> {
    if (!logoUrl) return null;

    const cacheKey = `logo:${companyId}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) {
      return Buffer.from(cached, 'base64');
    }

    try {
      const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      // Cache for 24 hours
      await this.redisClient.set(cacheKey, buffer.toString('base64'), 'EX', 86400);
      
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to fetch logo from ${logoUrl}`, error);
      return null;
    }
  }
}
