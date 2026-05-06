import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CACHE_KEY = 'exchange_rate:usd_try';
const CACHE_TTL = 3600; // 1 hour
const FALLBACK_RATE = 38.0;

@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async getUsdTryRate(): Promise<number> {
    try {
      const cached = await this.redis.get(CACHE_KEY);
      if (cached) return parseFloat(cached);
    } catch {
      // Redis unavailable — continue to fetch
    }

    const rate = await this.fetchFromTcmb() ?? await this.fetchFromFallback() ?? FALLBACK_RATE;

    try {
      await this.redis.setex(CACHE_KEY, CACHE_TTL, rate.toString());
    } catch {
      // ignore cache write failure
    }

    return rate;
  }

  private async fetchFromTcmb(): Promise<number | null> {
    try {
      const res = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml', {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const xml = await res.text();
      const match = xml.match(/<Currency[^>]+CurrencyCode="USD"[^>]*>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/);
      if (match?.[1]) {
        const rate = parseFloat(match[1]);
        this.logger.log(`TCMB USD/TRY rate: ${rate}`);
        return rate;
      }
      return null;
    } catch (err) {
      this.logger.warn(`TCMB fetch failed: ${err.message}`);
      return null;
    }
  }

  private async fetchFromFallback(): Promise<number | null> {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json() as { rates?: { TRY?: number } };
      const rate = data?.rates?.TRY;
      if (rate) {
        this.logger.log(`Fallback USD/TRY rate: ${rate}`);
        return rate;
      }
      return null;
    } catch (err) {
      this.logger.warn(`Fallback exchange rate fetch failed: ${err.message}`);
      return null;
    }
  }
}
