import Constants from 'expo-constants';

/**
 * Ponto único de configuração da integração com o backend.
 *
 * Enquanto os endpoints reais não existem, o app opera com dados mockados
 * (`fonte === 'mock'`). Para ligar a API de verdade, basta definir a variável
 * de ambiente `EXPO_PUBLIC_API_URL` (ou `extra.apiUrl` no app.json) — a
 * `fonte` passa automaticamente para `'api'` e os serviços em
 * `src/servicos/viagens.ts` começam a chamar o cliente HTTP.
 *
 * NENHUMA tela conhece a origem dos dados: tudo passa por `src/servicos`.
 */
const baseUrlEnv =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  '';

export type FonteDados = 'mock' | 'api';

export const API_CONFIG = {
  /** URL base da API (ex.: https://api.viajebrasilpassagens.com.br). */
  baseUrl: baseUrlEnv.replace(/\/$/, ''),
  /** 'mock' enquanto não há backend; 'api' quando `baseUrl` está definida. */
  fonte: (baseUrlEnv ? 'api' : 'mock') as FonteDados,
  /** Tempo máximo de espera por resposta (ms). */
  timeoutMs: 15000,
} as const;
