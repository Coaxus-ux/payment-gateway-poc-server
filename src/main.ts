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
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Checkout API')
    .setDescription('Checkout onboarding API')
    .setVersion('1.0.0')
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
