import { Module } from '@nestjs/common';

import { NotificacoesControlador } from './notificacoes.controlador';
import { NotificacoesServico } from './notificacoes.servico';

@Module({
  controllers: [NotificacoesControlador],
  providers: [NotificacoesServico],
  exports: [NotificacoesServico],
})
export class NotificacoesModule {}
