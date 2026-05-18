/*
 * Teligencia API bootstrap.
 * - Port: 3000 (default; PORT env overrides)
 * - CORS: explicit allowlist for Lab (4200) + Customer (4300) dev ports
 * - Global pipes: class-validator with whitelist + forbidNonWhitelisted
 * - Global prefix: /api/v1
 * - OpenAPI: /api/docs
 */

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, raw } from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  /*
   * The Clerk webhook signature verification needs the unparsed raw body
   * bytes. Apply express.raw() to that path only; everything else keeps
   * the default JSON parser.
   */
  app.use('/api/v1/webhooks/clerk', raw({ type: 'application/json' }));
  app.use(json());

  app.enableCors({
    origin: [
      'http://localhost:4200' /* lab dev */,
      'http://localhost:4300' /* customer dev */,
      'https://lab.teligencia.app',
      'https://app.teligencia.app',
      'https://teligencia.app',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const docs = new DocumentBuilder()
    .setTitle('Teligencia API')
    .setDescription(
      'Single API for Lab Portal + Customer Portal. ISO/IEC 17025 compliant.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docs);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  new Logger('Bootstrap').log(
    `Teligencia API live on http://localhost:${port}/api/v1`,
  );
  new Logger('Bootstrap').log(
    `OpenAPI explorer: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
