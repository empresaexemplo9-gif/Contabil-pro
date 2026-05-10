import { Module } from '@nestjs/common';
import { IntegracoesControlador } from './integracoes.controlador';
import { IntegracoesServico } from './integracoes.servico';
import { WebhooksControlador } from './webhooks.controlador';

@Module({
  controllers: [IntegracoesControlador, WebhooksControlador],
  providers: [IntegracoesServico],
  exports: [IntegracoesServico],
})
export class IntegracoesModule {}
