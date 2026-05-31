import { Global, Injectable, Module } from '@nestjs/common';

import { publicarJob, type NomeJob } from './fila';

@Injectable()
export class FilaServico {
  publicar<T>(
    nome: NomeJob,
    payload: T,
    opcoes?: { delaySegundos?: number; tentativas?: number },
  ): Promise<void> {
    return publicarJob(nome, payload, opcoes);
  }
}

@Global()
@Module({
  providers: [FilaServico],
  exports: [FilaServico],
})
export class FilaModule {}
