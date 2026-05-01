import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CronLockGuard implements CanActivate {
  private readonly redisClient: Redis;
  private readonly logger = new Logger(CronLockGuard.name);

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const jobName = context.getHandler().name;
    const lockKey = `cron:lock:${jobName}`;
    const ttl = 600; // 10 minutes

    const result = await this.redisClient.set(lockKey, 'locked', 'EX', ttl, 'NX');
    
    if (result !== 'OK') {
      this.logger.warn(`Cron job ${jobName} is already running on another instance. Skipping.`);
      return false;
    }

    // Release lock when done is handled manually or by TTL. 
    // In NestJS Cron, we don't have a built-in "after" hook in guards easily, 
    // so we rely on TTL or the service releasing it.
    return true;
  }

  async releaseLock(jobName: string) {
    const lockKey = `cron:lock:${jobName}`;
    await this.redisClient.del(lockKey);
  }
}
