import { Module } from '@nestjs/common';

import { AtendimentoControlador } from './atendimento.controlador';
import { AtendimentoGateway } from './atendimento.gateway';
import { AtendimentoServico } from './atendimento.servico';

@Module({
  controllers: [AtendimentoControlador],
  providers: [AtendimentoServico, AtendimentoGateway],
  exports: [AtendimentoServico, AtendimentoGateway],
})
export class AtendimentoModule {}
