import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppLogger } from './shared/logging/app-logger';
import { requestContextMiddleware } from './shared/request-context/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(new AppLogger());
  app.use(requestContextMiddleware);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('Checkout onboarding API')
    .setVersion('1.0.0')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  const config = app.get(ConfigService);
  const originList = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const corsMethods =
    config.get<string>('CORS_METHODS') ?? 'GET,POST,PATCH,OPTIONS';
  const corsHeaders =
    config.get<string>('CORS_HEADERS') ?? 'Content-Type,Authorization';
  const corsCredentials = config.get<boolean>('CORS_CREDENTIALS') ?? false;

  app.enableCors({
    origin: originList.length
      ? (
          origin: string | undefined,
          callback: (err: Error | null, allow?: boolean) => void,
        ) => {
          if (!origin || originList.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : true,
    methods: corsMethods,
    allowedHeaders: corsHeaders,
    credentials: corsCredentials,
  });
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
