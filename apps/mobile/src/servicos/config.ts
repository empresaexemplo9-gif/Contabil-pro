import Constants from 'expo-constants';

/**
 * Configuração da integração com o backend.
 *
 * Ordem de prioridade da fonte de dados:
 * 1. **supabase** — se EXPO_PUBLIC_SUPABASE_URL e ANON_KEY estiverem definidos.
 * 2. **api** — se EXPO_PUBLIC_API_URL estiver definido (REST genérica).
 * 3. **mock** — dados locais (sem backend).
 *
 * Nenhuma tela conhece a origem dos dados: tudo passa por `src/servicos`.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const baseUrlEnv = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? '';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

export const SUPABASE = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  ativo: Boolean(supabaseUrl && supabaseAnonKey),
} as const;

export type FonteDados = 'mock' | 'supabase' | 'api';

export const API_CONFIG = {
  baseUrl: baseUrlEnv.replace(/\/$/, ''),
  fonte: (SUPABASE.ativo ? 'supabase' : baseUrlEnv ? 'api' : 'mock') as FonteDados,
  timeoutMs: 15000,
} as const;
