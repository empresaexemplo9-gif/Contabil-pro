import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AuthControlador } from './auth.controlador';
import { AuthServico } from './auth.servico';
import { GoogleOauthServico } from './google-oauth.servico';

@Module({
  imports: [BullModule.registerQueue({ name: 'email' })],
  controllers: [AuthControlador],
  providers: [AuthServico, GoogleOauthServico],
  exports: [AuthServico],
})
export class AuthModule {}
