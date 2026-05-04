import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppLogger } from '../../common/logger/app-logger.service';

@Injectable()
export class BruteForceService {
  private readonly redis: Redis;

  // Ayarlar
  private readonly MAX_ATTEMPTS  = 5;    // kaç denemeden sonra kilitle
  private readonly BLOCK_TTL     = 900;  // 15 dakika (saniye)
  private readonly ATTEMPT_TTL   = 900;  // deneme sayacı TTL

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  // ── Anahtar üreticiler ────────────────────────────────────────────
  private attemptKey(ip: string, email: string): string {
    return `bf:attempts:${ip}:${email}`;
  }

  private blockKey(ip: string, email: string): string {
    return `bf:block:${ip}:${email}`;
  }

  private ipKey(ip: string): string {
    return `bf:ip:${ip}`;
  }

  // ── Engellenmiş mi kontrol et ─────────────────────────────────────
  async isBlocked(ip: string, email: string): Promise<{
    blocked: boolean;
    ttl?: number;
    reason?: string;
  }> {
    // Hem IP+email kombinasyonu hem de sadece IP kontrol et
    const [comboTTL, ipTTL] = await Promise.all([
      this.redis.ttl(this.blockKey(ip, email)),
      this.redis.ttl(this.ipKey(ip)),
    ]);

    if (comboTTL > 0) {
      this.logger.warn('Brute-force engeli aktif', { service: 'BruteForceService' }, {
        ip, email, ttl: comboTTL, reason: 'combo'
      });
      return { blocked: true, ttl: comboTTL, reason: 'combo' };
    }

    if (ipTTL > 0) {
      this.logger.warn('IP engeli aktif', { service: 'BruteForceService' }, {
        ip, ttl: ipTTL, reason: 'ip'
      });
      return { blocked: true, ttl: ipTTL, reason: 'ip' };
    }

    return { blocked: false };
  }

  // ── Başarısız deneme kaydet ───────────────────────────────────────
  async recordFailedAttempt(ip: string, email: string): Promise<{
    attempts: number;
    blocked: boolean;
    ttl?: number;
  }> {
    const key = this.attemptKey(ip, email);

    const attempts = await this.redis.incr(key);

    // İlk denemede TTL set et
    if (attempts === 1) {
      await this.redis.expire(key, this.ATTEMPT_TTL);
    }

    this.logger.warn('Başarısız giriş denemesi', { service: 'BruteForceService' }, {
      ip, email, attempts, max: this.MAX_ATTEMPTS
    });

    // Limit aşıldıysa engelle
    if (attempts >= this.MAX_ATTEMPTS) {
      await Promise.all([
        this.redis.setex(this.blockKey(ip, email), this.BLOCK_TTL, '1'),
        this.redis.del(key), // sayacı sıfırla
      ]);

      this.logger.warn('Brute-force engeli uygulandı', { service: 'BruteForceService' }, {
        ip, email, ttl: this.BLOCK_TTL
      });

      return { attempts, blocked: true, ttl: this.BLOCK_TTL };
    }

    return { attempts, blocked: false };
  }

  // ── Başarılı girişte sayacı sıfırla ──────────────────────────────
  async recordSuccess(ip: string, email: string): Promise<void> {
    await Promise.all([
      this.redis.del(this.attemptKey(ip, email)),
      this.redis.del(this.blockKey(ip, email)),
    ]);

    this.logger.debug('Başarılı giriş — sayaç sıfırlandı', { service: 'BruteForceService' }, {
      ip, email
    });
  }

  // ── Manuel reset (admin için) ─────────────────────────────────────
  async resetForEmail(email: string): Promise<{ deleted: number }> {
    // email içeren tüm brute-force key'lerini bul ve sil
    const pattern = `bf:*:*:${email}`;
    const keys    = await this.redis.keys(pattern);

    if (keys.length === 0) {
      this.logger.info('Reset: silinecek key yok', { service: 'BruteForceService' }, { email });
      return { deleted: 0 };
    }

    await this.redis.del(...keys);

    this.logger.info('Brute-force reset yapıldı', { service: 'BruteForceService' }, {
      email, deletedKeys: keys, count: keys.length
    });

    return { deleted: keys.length };
  }

  async resetForIp(ip: string): Promise<{ deleted: number }> {
    const pattern = `bf:*:${ip}:*`;
    const keys    = await this.redis.keys(pattern);

    // IP bazlı key'leri de ekle
    const ipKey = this.ipKey(ip);
    const allKeys = [...new Set([...keys, ipKey])];

    const existing = await Promise.all(allKeys.map(k => this.redis.exists(k)));
    const toDelete = allKeys.filter((_, i) => existing[i]);

    if (toDelete.length === 0) return { deleted: 0 };

    await this.redis.del(...toDelete);

    this.logger.info('IP brute-force reset yapıldı', { service: 'BruteForceService' }, {
      ip, deletedKeys: toDelete, count: toDelete.length
    });

    return { deleted: toDelete.length };
  }

  // ── Tüm brute-force kayıtlarını sil (tehlikeli — sadece dev/admin) ──
  async resetAll(): Promise<{ deleted: number }> {
    const keys = await this.redis.keys('bf:*');
    if (keys.length === 0) return { deleted: 0 };
    await this.redis.del(...keys);

    this.logger.warn('TÜM brute-force kayıtları silindi', { service: 'BruteForceService' }, {
      count: keys.length
    });

    return { deleted: keys.length };
  }

  // ── Mevcut durumu listele (admin için) ───────────────────────────
  async listBlocked(): Promise<Array<{ key: string; ttl: number }>> {
    const blockKeys = await this.redis.keys('bf:block:*');
    const ipKeys    = await this.redis.keys('bf:ip:*');
    const allKeys   = [...blockKeys, ...ipKeys];

    const result = await Promise.all(
      allKeys.map(async k => ({
        key: k,
        ttl: await this.redis.ttl(k),
      }))
    );

    return result.filter(r => r.ttl > 0);
  }
}
