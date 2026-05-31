export { API_CONFIG } from './config';
export type { FonteDados } from './config';
export { ErroApi, requisitar } from './cliente';
export {
  listarOfertas,
  listarDestinos,
  listarPacotes,
  buscar,
  obterProduto,
} from './viagens';
export type { FiltroBusca } from './viagens';
export {
  criarReserva,
  processarPagamento,
  autenticar,
} from './pedidos';
export type {
  FormaPagamento,
  DadosViajante,
  Comprovante,
  SessaoUsuario,
} from './pedidos';
