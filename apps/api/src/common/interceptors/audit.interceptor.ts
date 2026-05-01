import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.headers['x-forwarded-for'] || request.ip;

    return next.handle().pipe(
      tap((data) => {
        // Only log successful responses
        this.auditService.log({
          userId: user?.id || null,
          companyId: user?.company_id || null,
          action: metadata.action,
          targetType: metadata.targetType,
          targetId: data?.id || null,
          payload: {
            method: request.method,
            path: request.url,
            params: request.params,
            query: request.query,
            body: request.body,
          },
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        });
      }),
    );
  }
}
