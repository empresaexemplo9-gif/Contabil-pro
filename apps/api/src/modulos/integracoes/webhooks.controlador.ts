import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Publico } from '../../comum/decoradores/publico.decorador';
import { IntegracoesServico } from './integracoes.servico';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksControlador {
  constructor(private readonly servico: IntegracoesServico) {}

  @Publico()
  @Post('whatsapp')
  whatsapp(@Body() payload: unknown) {
    return this.servico.registrarEventoWebhook(null, 'whatsapp', payload);
  }

  @Publico()
  @Post('assinatura')
  assinatura(@Headers('x-evento') origem: string, @Body() payload: unknown) {
    return this.servico.registrarEventoWebhook(null, origem ?? 'assinatura', payload);
  }
}
