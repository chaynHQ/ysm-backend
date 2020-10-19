import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { Logger } from './logger/logger';
import { LoggingInterceptor } from './logger/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
  });

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.setGlobalPrefix('/api');

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  // see https://expressjs.com/en/guide/behind-proxies.html
  app.set('trust proxy', 1);

  if (process.env.NODE_ENV !== 'test') {
    app.use(
      rateLimit({
        windowMs: configService.get('rateLimit.windowMs'),
        max: configService.get('rateLimit.max'),
      }),
    );
  }

  await app.listen(configService.get('port'));
}
bootstrap();
