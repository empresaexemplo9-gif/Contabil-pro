import { Global, Module } from '@nestjs/common';

import { AutomacoesControlador } from './automacoes.controlador';
import { AutomacoesServico } from './automacoes.servico';
import { DispatcherAutomacoes } from './dispatcher.servico';

@Global()
@Module({
  controllers: [AutomacoesControlador],
  providers: [AutomacoesServico, DispatcherAutomacoes],
  exports: [AutomacoesServico, DispatcherAutomacoes],
})
export class AutomacoesModule {}
