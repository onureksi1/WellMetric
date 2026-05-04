import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { AppLogger } from '../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const request  = ctx.getRequest();
    const response = ctx.getResponse();
    const user     = request.user;
    const reqId    = request.requestId;

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const logCtx = {
      service:   'GlobalExceptionFilter',
      userId:    user?.id,
      companyId: user?.company_id,
      role:      user?.role,
      requestId: reqId,
      extra: {
        method: request.method,
        url:    request.url,
        ip:     request.ip,
      },
    };

    if (status >= 500) {
      this.logger.fatal('Yakalanmamış hata', logCtx, exception);
    } else if (status >= 400) {
      this.logger.warn('İstemci hatası', logCtx, exception instanceof HttpException
        ? exception.getResponse() : exception);
    }

    const isDev = process.env.NODE_ENV !== 'production';

    const errorResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { 
          error: { 
            code: (exception as any)?.code || 'INTERNAL_ERROR', 
            message: (exception as any)?.message || 'Sunucu hatası oluştu',
            // Geliştirme aşamasında hatanın detayını (örn. SQL hatası) frontend'e geç
            detail: isDev ? (exception as any)?.detail || (exception as any)?.stack : undefined
          } 
        };

    response.status(status).json({
      ...(typeof errorResponse === 'object' ? errorResponse : { message: errorResponse }),
      request_id: reqId,
      // Debug bilgisi (sadece dev)
      _debug: isDev ? {
        exception_name: (exception as any)?.name,
        stack: (exception as any)?.stack?.split('\n').slice(0, 3)
      } : undefined
    });
  }
}
