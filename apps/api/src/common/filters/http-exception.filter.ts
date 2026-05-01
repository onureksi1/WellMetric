import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const requestId = uuidv4();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Beklenmeyen bir sunucu hatası oluştu.';
    let details = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        code = exceptionResponse.code || this.getDefaultCode(status);
        message = exceptionResponse.message || exception.message;
        details = exceptionResponse.details || {};
      } else {
        code = this.getDefaultCode(status);
        message = exceptionResponse || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse = {
      error: {
        code,
        message,
        details,
        request_id: requestId,
      },
    };

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - Status: ${status} - Message: ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
