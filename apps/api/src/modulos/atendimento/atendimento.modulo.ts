import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AtendimentoControlador } from './atendimento.controlador';
import { AtendimentoGateway } from './atendimento.gateway';
import { AtendimentoServico } from './atendimento.servico';

@Module({
  imports: [BullModule.registerQueue({ name: 'whatsapp' })],
  controllers: [AtendimentoControlador],
  providers: [AtendimentoServico, AtendimentoGateway],
  exports: [AtendimentoServico, AtendimentoGateway],
})
export class AtendimentoModule {}
