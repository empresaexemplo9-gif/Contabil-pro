import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { NotificacoesControlador } from './notificacoes.controlador';
import { NotificacoesServico } from './notificacoes.servico';

@Module({
  imports: [BullModule.registerQueue({ name: 'notificacoes' })],
  controllers: [NotificacoesControlador],
  providers: [NotificacoesServico],
  exports: [NotificacoesServico],
})
export class NotificacoesModule {}
