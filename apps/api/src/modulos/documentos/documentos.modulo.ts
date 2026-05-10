import { Module } from '@nestjs/common';
import { DocumentosControlador } from './documentos.controlador';
import { DocumentosServico } from './documentos.servico';
import { ArmazenamentoServico } from './armazenamento.servico';

@Module({
  controllers: [DocumentosControlador],
  providers: [DocumentosServico, ArmazenamentoServico],
  exports: [DocumentosServico, ArmazenamentoServico],
})
export class DocumentosModule {}
