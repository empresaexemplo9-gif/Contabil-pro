import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';

import { AtendimentoModule } from '../atendimento/atendimento.modulo';

import { IntegracoesControlador } from './integracoes.controlador';
import { IntegracoesServico } from './integracoes.servico';
import { WebhooksControlador } from './webhooks.controlador';
import { WhatsappServico } from './whatsapp/whatsapp.servico';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'whatsapp' }),
    forwardRef(() => AtendimentoModule),
  ],
  controllers: [IntegracoesControlador, WebhooksControlador],
  providers: [IntegracoesServico, WhatsappServico],
  exports: [IntegracoesServico, WhatsappServico],
})
export class IntegracoesModule {}
