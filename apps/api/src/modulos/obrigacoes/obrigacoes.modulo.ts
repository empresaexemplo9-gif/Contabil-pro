import { Module } from '@nestjs/common';

import { ObrigacoesControlador } from './obrigacoes.controlador';
import { ObrigacoesServico } from './obrigacoes.servico';

@Module({
  controllers: [ObrigacoesControlador],
  providers: [ObrigacoesServico],
  exports: [ObrigacoesServico],
})
export class ObrigacoesModule {}
