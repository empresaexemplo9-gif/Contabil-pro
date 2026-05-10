import { randomBytes } from 'node:crypto';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';


import { configurarEnv } from '../../config/env';

@Injectable()
export class ArmazenamentoServico {
  private readonly cliente: S3Client;
  private readonly bucket: string;

  constructor() {
    const env = configurarEnv();
    this.bucket = env.S3_BUCKET;
    this.cliente = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
  }

  gerarChave(escritorioId: string, nomeArquivo: string): string {
    const sufixo = randomBytes(8).toString('hex');
    const limpo = nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${escritorioId}/${new Date().getFullYear()}/${sufixo}-${limpo}`;
  }

  async gerarUrlUpload(
    escritorioId: string,
    dados: { nome: string; mimeType: string; tamanhoBytes: number },
  ) {
    const chave = this.gerarChave(escritorioId, dados.nome);
    const comando = new PutObjectCommand({
      Bucket: this.bucket,
      Key: chave,
      ContentType: dados.mimeType,
      ContentLength: dados.tamanhoBytes,
    });
    const url = await getSignedUrl(this.cliente, comando, { expiresIn: 600 });
    return { url, chave, expiraEm: 600 };
  }

  async gerarUrlDownload(chave: string): Promise<string> {
    const comando = new GetObjectCommand({ Bucket: this.bucket, Key: chave });
    return getSignedUrl(this.cliente, comando, { expiresIn: 600 });
  }
}
