import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * TenantInterceptor — Injects the authenticated user's company_id
 * into every request so downstream services can scope queries automatically.
 */
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.user?.company_id) {
      request.tenantId = request.user.company_id;
    }
    return next.handle();
  }
}
