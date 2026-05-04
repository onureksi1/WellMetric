import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppLogger } from '../logger/app-logger.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req        = context.switchToHttp().getRequest();
    const res        = context.switchToHttp().getResponse();
    const startTime  = Date.now();
    const requestId  = uuid();
    const user       = req.user;

    // Her isteğe requestId ata — hata takibinde kullan
    req.requestId = requestId;

    const ctx = {
      service:   context.getClass().name,
      method:    context.getHandler().name,
      userId:    user?.id, // User metadata'da .id kullanılıyor genellikle Nest auth sisteminde
      companyId: user?.company_id,
      role:      user?.role,
      requestId,
    };

    // Hassas path'leri loglamak için body maskele
    const skipBodyPaths = ['/auth/login', '/auth/change-password'];
    const bodyToLog = skipBodyPaths.some(p => req.url.includes(p))
      ? { _skipped: 'sensitive endpoint' }
      : req.body;

    this.logger.debug(`→ ${req.method} ${req.url}`, ctx, {
      params: req.params,
      query:  req.query,
      body:   bodyToLog,
    });

    return next.handle().pipe(
      tap(data => {
        const duration = Date.now() - startTime;
        const status   = res.statusCode;

        if (status >= 400) {
          this.logger.warn(`← ${status} ${req.method} ${req.url}`, { ...ctx, duration }, data);
        } else {
          this.logger.info(`← ${status} ${req.method} ${req.url}`, { ...ctx, duration });
        }
      }),
      catchError(err => {
        const duration = Date.now() - startTime;
        const status   = err instanceof HttpException ? err.getStatus() : 500;

        this.logger.error(
          `← ${status} ${req.method} ${req.url} HATA`,
          { ...ctx, duration },
          err,
        );

        return throwError(() => err);
      }),
    );
  }
}
