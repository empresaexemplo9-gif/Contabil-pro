import { Module } from '@nestjs/common';
import { AtendimentoControlador } from './atendimento.controlador';
import { AtendimentoServico } from './atendimento.servico';
import { AtendimentoGateway } from './atendimento.gateway';

@Module({
  controllers: [AtendimentoControlador],
  providers: [AtendimentoServico, AtendimentoGateway],
  exports: [AtendimentoServico],
})
export class AtendimentoModule {}
