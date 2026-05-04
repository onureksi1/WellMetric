type FELevel = 'debug' | 'info' | 'warn' | 'error';

interface FELogCtx {
  page?:      string;
  component?: string;
  userId?:    string;
  action?:    string;
}

const isDev = process.env.NODE_ENV !== 'production';

function log(level: FELevel, message: string, ctx?: FELogCtx, data?: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...ctx,
    data,
  };

  if (isDev) {
    const styles: Record<FELevel, string> = {
      debug: 'color: #0EA5E9',
      info:  'color: #22C55E',
      warn:  'color: #F59E0B',
      error: 'color: #EF4444; font-weight: bold',
    };
    console.log(
      `%c[${level.toUpperCase()}] ${message}`,
      styles[level],
      ctx ?? '',
      data ?? '',
    );
  } else {
    // Prod'da sadece warn+ konsola yaz
    if (level === 'warn' || level === 'error') {
      console[level](JSON.stringify(entry));
    }
    // TODO: Sentry veya benzeri bir servise gönder
  }
}

export const logger = {
  debug: (msg: string, ctx?: FELogCtx, data?: unknown) => log('debug', msg, ctx, data),
  info:  (msg: string, ctx?: FELogCtx, data?: unknown) => log('info',  msg, ctx, data),
  warn:  (msg: string, ctx?: FELogCtx, data?: unknown) => log('warn',  msg, ctx, data),
  error: (msg: string, ctx?: FELogCtx, data?: unknown) => log('error', msg, ctx, data),
};
