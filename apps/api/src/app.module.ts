import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bullmq';

import { configurarEnv } from './config/env';
import { PrismaModule } from './comum/prisma/prisma.module';
import { SaudeController } from './comum/saude/saude.controlador';

import { AuthModule } from './modulos/auth/auth.modulo';
import { EscritoriosModule } from './modulos/escritorios/escritorios.modulo';
import { UsuariosModule } from './modulos/usuarios/usuarios.modulo';
import { RbacModule } from './modulos/rbac/rbac.modulo';
import { EmpresasModule } from './modulos/empresas/empresas.modulo';
import { DocumentosModule } from './modulos/documentos/documentos.modulo';
import { AssinaturasModule } from './modulos/assinaturas/assinaturas.modulo';
import { ObrigacoesModule } from './modulos/obrigacoes/obrigacoes.modulo';
import { TarefasModule } from './modulos/tarefas/tarefas.modulo';
import { AtendimentoModule } from './modulos/atendimento/atendimento.modulo';
import { NotificacoesModule } from './modulos/notificacoes/notificacoes.modulo';
import { AutomacoesModule } from './modulos/automacoes/automacoes.modulo';
import { RelatoriosModule } from './modulos/relatorios/relatorios.modulo';
import { IntegracoesModule } from './modulos/integracoes/integracoes.modulo';
import { AuditoriaModule } from './modulos/auditoria/auditoria.modulo';
import { FaturamentoModule } from './modulos/faturamento/faturamento.modulo';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: () => configurarEnv(),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: { ignore: (req) => req.url === '/saude' },
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
    }),
    PrismaModule,

    AuthModule,
    EscritoriosModule,
    UsuariosModule,
    RbacModule,
    EmpresasModule,
    DocumentosModule,
    AssinaturasModule,
    ObrigacoesModule,
    TarefasModule,
    AtendimentoModule,
    NotificacoesModule,
    AutomacoesModule,
    RelatoriosModule,
    IntegracoesModule,
    AuditoriaModule,
    FaturamentoModule,
  ],
  controllers: [SaudeController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
