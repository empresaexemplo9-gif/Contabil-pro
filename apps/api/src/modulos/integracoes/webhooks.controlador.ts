import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';


import { Publico } from '../../comum/decoradores/publico.decorador';

import { IntegracoesServico } from './integracoes.servico';
import { WhatsappServico } from './whatsapp/whatsapp.servico';

import type { Response } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksControlador {
  constructor(
    private readonly servico: IntegracoesServico,
    private readonly whatsapp: WhatsappServico,
  ) {}

  /**
   * Endpoint de verificação do webhook do WhatsApp. A Meta envia GET com
   * hub.mode='subscribe', hub.verify_token e hub.challenge ao registrar a URL.
   */
  @Publico()
  @Get('whatsapp')
  async verificarWhatsapp(
    @Query('hub.mode') hubMode: string,
    @Query('hub.verify_token') hubVerifyToken: string,
    @Query('hub.challenge') hubChallenge: string,
    @Res() resposta: Response,
  ) {
    const desafio = await this.whatsapp.verificarWebhook(hubMode, hubVerifyToken, hubChallenge);
    if (desafio) {
      resposta.status(200).send(desafio);
    } else {
      resposta.status(403).send('forbidden');
    }
  }

  @Publico()
  @Post('whatsapp')
  @HttpCode(200)
  async receberWhatsapp(@Body() payload: unknown) {
    await this.servico.registrarEventoWebhook(null, 'whatsapp', payload);
    await this.whatsapp.processarWebhook(payload);
    return { ok: true };
  }

  @Publico()
  @Post('assinatura')
  assinatura(@Headers('x-evento') origem: string, @Body() payload: unknown) {
    return this.servico.registrarEventoWebhook(null, origem ?? 'assinatura', payload);
  }
}
