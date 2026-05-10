import { Module } from '@nestjs/common';
import { FaturamentoControlador } from './faturamento.controlador';
import { FaturamentoServico } from './faturamento.servico';

@Module({
  controllers: [FaturamentoControlador],
  providers: [FaturamentoServico],
})
export class FaturamentoModule {}
