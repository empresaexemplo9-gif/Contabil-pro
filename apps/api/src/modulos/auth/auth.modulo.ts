import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthControlador } from './auth.controlador';
import { AuthServico } from './auth.servico';

@Module({
  imports: [BullModule.registerQueue({ name: 'email' })],
  controllers: [AuthControlador],
  providers: [AuthServico],
  exports: [AuthServico],
})
export class AuthModule {}
