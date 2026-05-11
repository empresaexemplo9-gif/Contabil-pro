import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AssinaturasControlador } from './assinaturas.controlador';
import { AssinaturasServico } from './assinaturas.servico';

@Module({
  imports: [BullModule.registerQueue({ name: 'assinaturas' })],
  controllers: [AssinaturasControlador],
  providers: [AssinaturasServico],
  exports: [AssinaturasServico],
})
export class AssinaturasModule {}
