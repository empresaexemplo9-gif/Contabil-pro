import { Module } from '@nestjs/common';
import { AssinaturasControlador } from './assinaturas.controlador';
import { AssinaturasServico } from './assinaturas.servico';

@Module({
  controllers: [AssinaturasControlador],
  providers: [AssinaturasServico],
  exports: [AssinaturasServico],
})
export class AssinaturasModule {}
