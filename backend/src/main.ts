import 'dotenv/config';
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();
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
