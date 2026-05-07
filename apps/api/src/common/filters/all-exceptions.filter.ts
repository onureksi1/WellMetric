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

    let errorBody: any = exception instanceof HttpException
      ? exception.getResponse()
      : { 
          error: { 
            code: (exception as any)?.code || 'INTERNAL_ERROR', 
            message: (exception as any)?.message || 'Sunucu hatası oluştu',
            detail: isDev ? (exception as any)?.detail || (exception as any)?.stack : undefined
          } 
        };

    // ValidationPipe hatalarını (message dizisi) yakala ve güzelleştir
    if (typeof errorBody === 'object' && Array.isArray(errorBody.message)) {
      const messages = errorBody.message as string[];
      // "questions.8.dimension must be..." -> "8. Soru: Dimension alanı geçerli değil" gibi çevrilebilir
      // Ama şimdilik en azından tek bir string haline getirip frontend'e verelim
      errorBody = {
        error: {
          code: 'VALIDATION_ERROR',
          message: messages.length > 1 
            ? `Birden fazla hata var:\n• ${messages.join('\n• ')}`
            : messages[0],
          details: messages
        }
      };
    }

    response.status(status).json({
      ...(typeof errorBody === 'object' ? errorBody : { message: errorBody }),
      request_id: reqId,
      _debug: isDev ? {
        exception_name: (exception as any)?.name,
        stack: (exception as any)?.stack?.split('\n').slice(0, 3)
      } : undefined
    });
  }
}
