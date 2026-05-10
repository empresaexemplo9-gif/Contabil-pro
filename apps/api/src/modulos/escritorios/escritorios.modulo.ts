import { Module } from '@nestjs/common';
import { EscritoriosControlador } from './escritorios.controlador';
import { EscritoriosServico } from './escritorios.servico';

@Module({
  controllers: [EscritoriosControlador],
  providers: [EscritoriosServico],
  exports: [EscritoriosServico],
})
export class EscritoriosModule {}
