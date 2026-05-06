import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { AppLogger } from '../logger/app-logger.service';

@Injectable()
export class ExchangeRateService {
  private readonly CACHE_KEY = 'exchange:usd_try';
  private readonly CACHE_TTL = 3600; // 1 saat
  private readonly FALLBACK  = 38.0; // güncel fallback

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: AppLogger,
  ) {}

  async getUsdTry(): Promise<number> {
    // Redis cache kontrol
    try {
      const cached = await this.redis.get(this.CACHE_KEY);
      if (cached) return parseFloat(cached);
    } catch (err) {
      this.logger.warn('Redis cache kontrolü başarısız', { service: 'ExchangeRateService' }, { error: err.message });
    }

    try {
      // TCMB XML feed — ücretsiz, kayıt yok
      const res = await fetch(
        'https://www.tcmb.gov.tr/kurlar/today.xml',
        { signal: AbortSignal.timeout(5000) }
      );
      const xml = await res.text();

      const match = xml.match(
        /<Currency[^>]*CurrencyCode="USD"[^>]*>[\s\S]*?<ForexSelling>([\d.]+)<\/ForexSelling>/
      );

      if (match?.[1]) {
        const rate = parseFloat(match[1]);
        await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, String(rate));
        this.logger.info('USD/TRY kuru alındı', { service: 'ExchangeRateService' }, {
          rate, source: 'TCMB'
        });
        return rate;
      }
      throw new Error('Kur parse edilemedi');

    } catch (err) {
      this.logger.warn('TCMB kur alınamadı, fallback deneniyor', {
        service: 'ExchangeRateService'
      }, { error: err.message });

      // Fallback: exchangerate-api
      try {
        const res2 = await fetch(
          'https://api.exchangerate-api.com/v4/latest/USD',
          { signal: AbortSignal.timeout(5000) }
        );
        const data = await res2.json();
        const rate = data.rates?.TRY;
        if (rate) {
          await this.redis.setex(this.CACHE_KEY, this.CACHE_TTL, String(rate));
          this.logger.info('USD/TRY kuru alındı (fallback)', {
            service: 'ExchangeRateService'
          }, { rate, source: 'exchangerate-api' });
          return rate;
        }
      } catch { /* sessizce geç */ }

      this.logger.warn('Tüm kur kaynakları başarısız, fallback kullanılıyor', {
        service: 'ExchangeRateService'
      }, { fallback: this.FALLBACK });
      return this.FALLBACK;
    }
  }
}
