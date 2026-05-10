import { Module } from '@nestjs/common';

import { AutomacoesControlador } from './automacoes.controlador';
import { AutomacoesServico } from './automacoes.servico';

@Module({
  controllers: [AutomacoesControlador],
  providers: [AutomacoesServico],
  exports: [AutomacoesServico],
})
export class AutomacoesModule {}
