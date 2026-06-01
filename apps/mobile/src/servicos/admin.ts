/**
 * Serviços administrativos: preços e parceiros. Em modo `mock` persistem
 * localmente (AsyncStorage) via repositório; em modo `api` chamam os endpoints
 * `/admin/*` (a definir com o backend). Assim a troca não exige mudar as telas.
 */
import { carregarParceiros, carregarOverridesPreco, definirPreco, salvarParceiros } from '../admin/repositorio';
import type { Parceiro } from '../admin/tipos';
import { API_CONFIG } from './config';
import { requisitar } from './cliente';

export async function listarParceiros(): Promise<Parceiro[]> {
  if (API_CONFIG.fonte === 'api') return requisitar<Parceiro[]>('/admin/parceiros');
  return carregarParceiros();
}

export async function salvarParceiro(parceiro: Parceiro): Promise<Parceiro[]> {
  if (API_CONFIG.fonte === 'api') {
    await requisitar(`/admin/parceiros/${parceiro.id}`, {
      method: 'PUT',
      body: JSON.stringify(parceiro),
    });
    return listarParceiros();
  }
  const lista = await carregarParceiros();
  const i = lista.findIndex((p) => p.id === parceiro.id);
  if (i >= 0) lista[i] = parceiro;
  else lista.push(parceiro);
  await salvarParceiros(lista);
  return lista;
}

export async function removerParceiro(id: string): Promise<Parceiro[]> {
  if (API_CONFIG.fonte === 'api') {
    await requisitar(`/admin/parceiros/${id}`, { method: 'DELETE' });
    return listarParceiros();
  }
  const lista = (await carregarParceiros()).filter((p) => p.id !== id);
  await salvarParceiros(lista);
  return lista;
}

export async function overridesPreco(): Promise<Record<string, number>> {
  if (API_CONFIG.fonte === 'api') return requisitar<Record<string, number>>('/admin/precos');
  return carregarOverridesPreco();
}

export async function definirPrecoProduto(id: string, preco: number): Promise<void> {
  if (API_CONFIG.fonte === 'api') {
    await requisitar(`/admin/precos/${id}`, { method: 'PUT', body: JSON.stringify({ preco }) });
    return;
  }
  await definirPreco(id, preco);
}
