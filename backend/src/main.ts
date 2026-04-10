import 'dotenv/config';
import 'reflect-metadata';

import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

function resolveCorsOptions() {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) {
    return { origin: true as const };
  }
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    return { origin: true as const };
  }
  return {
    origin: origins,
    credentials: true as const,
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.ALL }],
  });
  app.enableCors(resolveCorsOptions());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trusted Network API')
    .setDescription(
      'Housing-first MVP backend APIs for tenant replacement listings, trust, and authentication.',
    )
    .setVersion('1.0.0')
    .addTag('health')
    .addTag('auth')
    .addTag('verification')
    .addTag('listings')
    .addTag('listing-inquiries')
    .addTag('housing-needs')
    .addTag('notifications')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDocument, {
    jsonDocumentUrl: 'swagger-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
