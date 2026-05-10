import pino, { type Logger, type LoggerOptions } from 'pino';

const ehProducao = process.env.NODE_ENV === 'production';

const opcoesBase: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (ehProducao ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.senha',
      '*.senhaHash',
      '*.tokenAcesso',
      '*.tokenRefresh',
      '*.credenciais',
      '*.mfaSegredo',
    ],
    censor: '[REDIGIDO]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    servico: process.env.SERVICO ?? 'contabilpro',
    ambiente: process.env.NODE_ENV ?? 'development',
  },
};

const transporte = ehProducao
  ? undefined
  : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } };

export const logger: Logger = pino({ ...opcoesBase, ...(transporte ? { transport: transporte } : {}) });

export function logComContexto(contexto: Record<string, unknown>): Logger {
  return logger.child(contexto);
}

export type { Logger };
