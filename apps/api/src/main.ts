import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { AppLogger } from './common/logger/app-logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.use(cookieParser());

  // Global interceptor — log all requests
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Global exception filter — catch and log all errors
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Global validation pipe — strips unknown properties, validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS — dynamic origin detection
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_APP_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://wellbeingmetric.com',
        'https://www.wellbeingmetric.com',
        /\.wellbeingmetric\.com$/,
      ].filter(Boolean);

      if (!origin || allowedOrigins.some(ao => 
        ao instanceof RegExp ? ao.test(origin) : ao === origin
      )) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Request-ID'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.API_PORT ?? 3001;

  logger.info('Uygulama başlatılıyor', { service: 'Bootstrap' }, {
    env:  process.env.NODE_ENV,
    port: port,
  });

  await app.listen(port);

  logger.info('Uygulama hazır', { service: 'Bootstrap' }, {
    url: `http://localhost:${port}/api/v1`,
  });
}

bootstrap();
