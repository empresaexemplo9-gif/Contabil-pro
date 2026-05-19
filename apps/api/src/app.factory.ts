import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { FiltroExcecoesGlobais } from './comum/filtros/excecoes-globais.filtro';
import { configurarEnv } from './config/env';

/**
 * Cria e configura a aplicação NestJS sem chamar `listen`.
 *
 * Usado por:
 * - `main.ts` (modo servidor tradicional: Railway, Docker, dev local)
 * - `api/index.ts` (modo serverless: Vercel Functions)
 *
 * Mantemos a configuração em um único lugar pra evitar drift entre os
 * dois modos de execução.
 */
export async function criarApp(): Promise<INestApplication> {
  const env = configurarEnv();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
  });
  app.setGlobalPrefix('api/v1', { exclude: ['saude', 'docs'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new FiltroExcecoesGlobais());

  const config = new DocumentBuilder()
    .setTitle('ContabilPro API')
    .setDescription('API REST da plataforma ContabilPro')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento);

  return app;
}
