import { Module } from '@nestjs/common';

import { AuthControlador } from './auth.controlador';
import { AuthServico } from './auth.servico';

@Module({
  controllers: [AuthControlador],
  providers: [AuthServico],
  exports: [AuthServico],
})
export class AuthModule {}
