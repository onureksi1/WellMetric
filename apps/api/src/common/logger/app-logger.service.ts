import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  service?:    string;   // 'BillingService'
  method?:     string;   // 'createPayment'
  userId?:     string;
  companyId?:  string;
  role?:       string;
  requestId?:  string;
  duration?:   number;   // ms
  provider?:   string;   // 'stripe' | 'paytr'
  extra?:      Record<string, unknown>;
}

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private readonly isDev: boolean;
  private readonly sensitiveKeys = [
    'password', 'password_hash', 'cardNumber', 'cvc', 'cvv',
    'expireMonth', 'expireYear', 'api_key', 'secret', 'token',
    'authorization', 'cookie', 'STRIPE_SECRET',
  ];

  constructor(private config: ConfigService) {
    this.isDev = this.config.get('NODE_ENV') !== 'production';
  }

  private maskSensitive(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(i => this.maskSensitive(i));

    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const lk = key.toLowerCase();
      if (this.sensitiveKeys.some(s => lk.includes(s.toLowerCase()))) {
        masked[key] = typeof val === 'string'
          ? `${val.slice(0, 4)}****${val.slice(-2)}`
          : '****';
      } else {
        masked[key] = this.maskSensitive(val);
      }
    }
    return masked;
  }

  private format(
    level: LogLevel,
    message: string,
    ctx?: LogContext,
    data?: unknown,
  ): string {
    const entry = {
      ts:        new Date().toISOString(),
      level,
      message,
      ...ctx,
      data: data !== undefined ? this.maskSensitive(data) : undefined,
    };

    // Dev'de renkli okunabilir format, prod'da JSON
    if (this.isDev) {
      const colors: Record<LogLevel, string> = {
        debug: '\x1b[36m', // cyan
        info:  '\x1b[32m', // green
        warn:  '\x1b[33m', // yellow
        error: '\x1b[31m', // red
        fatal: '\x1b[35m', // magenta
      };
      const reset = '\x1b[0m';
      const color = colors[level];
      const prefix = `${color}[${level.toUpperCase()}]${reset}`;
      const svc = ctx?.service ? `\x1b[90m${ctx.service}${ctx.method ? `.${ctx.method}` : ''}${reset} ` : '';
      const uid = ctx?.userId ? `\x1b[90muid:${ctx.userId.slice(0,8)}${reset} ` : '';
      const dur = ctx?.duration !== undefined ? `\x1b[90m(${ctx.duration}ms)${reset}` : '';
      const dataStr = data !== undefined
        ? '\n  ' + JSON.stringify(this.maskSensitive(data), null, 2).replace(/\n/g, '\n  ')
        : '';
      return `${prefix} ${svc}${uid}${message} ${dur}${dataStr}`;
    }

    return JSON.stringify(entry);
  }

  debug(message: string, ctx?: LogContext, data?: unknown) {
    if (this.isDev) process.stdout.write(this.format('debug', message, ctx, data) + '\n');
  }

  info(message: string, ctx?: LogContext, data?: unknown) {
    process.stdout.write(this.format('info', message, ctx, data) + '\n');
  }

  warn(message: string, ctx?: LogContext, data?: unknown) {
    process.stdout.write(this.format('warn', message, ctx, data) + '\n');
  }

  error(message: string, ctx?: LogContext, error?: unknown) {
    const errData = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    process.stderr.write(this.format('error', message, ctx, errData) + '\n');
  }

  fatal(message: string, ctx?: LogContext, error?: unknown) {
    const errData = error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    process.stderr.write(this.format('fatal', message, ctx, errData) + '\n');
  }

  // NestJS LoggerService uyumu
  log(message: string)     { this.info(message); }
  verbose(message: string) { this.debug(message); }
}
