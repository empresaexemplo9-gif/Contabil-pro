import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { FiltroExcecoesGlobais } from './comum/filtros/excecoes-globais.filtro';
import { configurarEnv } from './config/env';

async function iniciar() {
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

  await app.listen(env.API_PORT);
  console.warn(`[api] escutando em http://localhost:${env.API_PORT}`);
}

iniciar().catch((erro) => {
  console.error('[api] falha ao iniciar', erro);
  process.exit(1);
});
