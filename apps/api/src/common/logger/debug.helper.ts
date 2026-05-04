import { AppLogger, LogContext } from './app-logger.service';

export class ServiceDebugger {
  constructor(
    private readonly logger: AppLogger,
    private readonly serviceName: string,
  ) {}

  // Metod başında çağır
  start(method: string, ctx: Partial<LogContext>, params?: unknown) {
    this.logger.debug(`${method} başladı`, {
      service: this.serviceName,
      method,
      ...ctx,
    }, params);
  }

  // Metod sonunda çağır
  done(method: string, ctx: Partial<LogContext>, result?: unknown) {
    this.logger.info(`${method} tamamlandı`, {
      service: this.serviceName,
      method,
      ...ctx,
    }, typeof result === 'object'
      ? { summary: JSON.stringify(result).slice(0, 200) }
      : result);
  }

  // Hata yakalandığında
  fail(method: string, ctx: Partial<LogContext>, error: unknown) {
    this.logger.error(`${method} başarısız`, {
      service: this.serviceName,
      method,
      ...ctx,
    }, error);
  }

  // Kritik iş akışı adımları için
  step(method: string, step: string, ctx: Partial<LogContext>, data?: unknown) {
    this.logger.debug(`${method} → ${step}`, {
      service: this.serviceName,
      method,
      ...ctx,
    }, data);
  }

  // Dış servis çağrıları için (Stripe, iyzico, AI API vs.)
  external(service: string, action: string, ctx: Partial<LogContext>, data?: unknown) {
    this.logger.debug(`[EXT] ${service}.${action}`, {
      service:  this.serviceName,
      provider: service,
      ...ctx,
    }, data);
  }
}
