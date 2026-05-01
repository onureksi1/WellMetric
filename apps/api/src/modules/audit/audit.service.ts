import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, MoreThan, In } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogParams } from './types/audit-log-params.type';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly redisClient: Redis;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
    });
  }

  async log(params: AuditLogParams): Promise<void> {
    try {
      const maskedPayload = this.maskSensitiveData(params.payload);
      
      const auditLog = this.auditRepository.create({
        user_id: params.userId,
        company_id: params.companyId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId,
        payload: maskedPayload,
        ip_address: params.ipAddress,
      });

      await this.auditRepository.save(auditLog);
      
      // Invalidate critical cache if action is critical
      if (this.isCriticalAction(params.action)) {
        await this.redisClient.del('audit:critical:recent');
      }
    } catch (error) {
      // Never throw from audit log
      this.logger.error(`Audit log failed: ${params.action}`, error.stack);
    }
  }

  // Deprecated or alternative to log() if needed for older implementations
  async logAction(userId: string | null, companyId: string | null, action: string, targetType?: string, targetId?: string, payload?: any) {
      return this.log({ userId, companyId, action, targetType, targetId, payload });
  }

  async findAll(filters: AuditFilterDto) {
    const { company_id, user_id, action, target_type, date_from, date_to, page = 1, per_page = 100 } = filters;

    const query = this.auditRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .where('1=1');

    if (company_id) query.andWhere('audit.company_id = :company_id', { company_id });
    if (user_id) query.andWhere('audit.user_id = :user_id', { user_id });
    if (target_type) query.andWhere('audit.target_type = :target_type', { target_type });
    if (action) query.andWhere('audit.action ILIKE :action', { action: `%${action}%` });
    
    if (date_from && date_to) {
      query.andWhere('audit.created_at BETWEEN :from AND :to', { from: date_from, to: date_to });
    } else if (date_from) {
      query.andWhere('audit.created_at >= :from', { from: date_from });
    } else if (date_to) {
      query.andWhere('audit.created_at <= :to', { to: date_to });
    }

    const [items, total] = await query
      .orderBy('audit.created_at', 'DESC')
      .skip((page - 1) * per_page)
      .take(per_page)
      .getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
      },
    };
  }

  async findByCompany(companyId: string, filters: AuditFilterDto) {
    filters.company_id = companyId;
    return this.findAll(filters);
  }

  async getRecentCritical(): Promise<AuditLog[]> {
    const cacheKey = 'audit:critical:recent';
    const cached = await this.redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const criticalActions = [
      'settings.api_keys.update',
      'company.delete',
      'company.status_change',
      'user.status_change',
      'settings.update',
    ];

    const logs = await this.auditRepository.find({
      where: {
        action: In(criticalActions),
        created_at: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      },
      order: { created_at: 'DESC' },
      take: 20,
      relations: ['user'],
    });

    await this.redisClient.set(cacheKey, JSON.stringify(logs), 'EX', 300); // 5 mins
    return logs;
  }

  async cleanOldAuditLogs(): Promise<void> {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const result = await this.auditRepository.createQueryBuilder()
      .delete()
      .where('created_at < :date', { date: threeYearsAgo })
      .execute();

    this.logger.log(`Cleaned old audit logs. Deleted records: ${result.affected}`);
  }

  private maskSensitiveData(payload?: Record<string, any>): Record<string, any> | null {
    if (!payload) return null;
    const sensitiveKeys = ['password', 'api_key', 'secret', 'token', 'access_key', 'secret_key'];
    const masked = { ...payload };

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = '***';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  private isCriticalAction(action: string): boolean {
    const criticalActions = [
      'settings.api_keys.update',
      'company.delete',
      'company.status_change',
      'user.status_change',
      'settings.update',
    ];
    return criticalActions.includes(action);
  }
}
