import { Module } from '@nestjs/common';
import { RelatoriosControlador } from './relatorios.controlador';
import { RelatoriosServico } from './relatorios.servico';

@Module({
  controllers: [RelatoriosControlador],
  providers: [RelatoriosServico],
})
export class RelatoriosModule {}
