/**
 * Serviços de catálogo de viagens — a fronteira entre as telas e a origem
 * dos dados. Hoje retornam dados mockados (`src/dados`); quando os endpoints
 * existirem, troque cada ramo `mock` pela chamada correspondente ao
 * `requisitar(...)`. As assinaturas já são assíncronas justamente para que
 * essa troca não exija mudar nenhuma tela.
 *
 * Contrato de endpoints previsto (a confirmar com o backend / PassHub):
 *   GET  /ofertas                              -> BannerOferta[]
 *   GET  /destinos                             -> Destino[]
 *   GET  /pacotes                              -> PacoteTurismo[]
 *   GET  /busca?categoria=&origem=&destino=    -> ProdutoViagem[]
 *   GET  /produtos/:id                         -> ProdutoViagem
 */
import {
  banners,
  buscarPorCategoria,
  buscarProduto,
  destinos,
  pacotes,
} from '../dados';
import type {
  BannerOferta,
  Categoria,
  Destino,
  PacoteTurismo,
  ProdutoViagem,
} from '../tipos';
import { API_CONFIG } from './config';
import { requisitar } from './cliente';

export interface FiltroBusca {
  origem?: string;
  destino?: string;
}

export async function listarOfertas(): Promise<BannerOferta[]> {
  if (API_CONFIG.fonte === 'api') return requisitar<BannerOferta[]>('/ofertas');
  return banners;
}

export async function listarDestinos(): Promise<Destino[]> {
  if (API_CONFIG.fonte === 'api') return requisitar<Destino[]>('/destinos');
  return destinos;
}

export async function listarPacotes(): Promise<PacoteTurismo[]> {
  if (API_CONFIG.fonte === 'api') return requisitar<PacoteTurismo[]>('/pacotes');
  return pacotes;
}

export async function buscar(
  categoria: Categoria,
  filtro: FiltroBusca = {},
): Promise<ProdutoViagem[]> {
  if (API_CONFIG.fonte === 'api') {
    const query = new URLSearchParams({ categoria });
    if (filtro.origem) query.set('origem', filtro.origem);
    if (filtro.destino) query.set('destino', filtro.destino);
    return requisitar<ProdutoViagem[]>(`/busca?${query.toString()}`);
  }
  return buscarPorCategoria(categoria, filtro);
}

export async function obterProduto(id: string): Promise<ProdutoViagem | null> {
  if (API_CONFIG.fonte === 'api') return requisitar<ProdutoViagem>(`/produtos/${id}`);
  return buscarProduto(id);
}
