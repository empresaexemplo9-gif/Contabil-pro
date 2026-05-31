/**
 * Registro dos handlers de jobs para execução inline em dev e ponto de
 * reexport da API pública de publicação.
 *
 * Este módulo conhece todos os handlers; por isso ele os **registra** em
 * `publicar.ts` (que não importa job algum). Assim os jobs podem importar
 * `publicarJob` de `./publicar` sem criar ciclo de dependência.
 *
 * Carregado no bootstrap via `fila.module.ts` (FilaServico), o que garante
 * que os handlers estejam registrados antes de qualquer publicação inline.
 */
import { detectarAtrasadas } from '../../jobs/detectar-atrasadas.job';
import { enviarAssinatura } from '../../jobs/enviar-assinatura.job';
import { processarEmail } from '../../jobs/enviar-email.job';
import { processarNotificacao } from '../../jobs/enviar-notificacao.job';
import { processarWhatsapp } from '../../jobs/enviar-whatsapp.job';
import { executarAutomacao } from '../../jobs/executar-automacao.job';
import { gerarTarefasAutomaticas } from '../../jobs/gerar-tarefas-automaticas.job';
import { lembrarObrigacoes } from '../../jobs/lembrar-obrigacao.job';
import { processarDocumento } from '../../jobs/processar-documento.job';

import { registrarHandlerInline } from './publicar';

registrarHandlerInline('enviar-email', (p) => processarEmail(p));
registrarHandlerInline('enviar-whatsapp', (p) => processarWhatsapp(p));
registrarHandlerInline('enviar-notificacao', (p) => processarNotificacao(p));
registrarHandlerInline('enviar-assinatura', (p) => enviarAssinatura(p));
registrarHandlerInline('processar-documento', (p) => processarDocumento(p));
registrarHandlerInline('executar-automacao', (p) => executarAutomacao(p));
registrarHandlerInline('detectar-atrasadas', () => detectarAtrasadas());
registrarHandlerInline('gerar-tarefas-automaticas', (p) => gerarTarefasAutomaticas(p));
registrarHandlerInline('lembrar-obrigacoes', () => lembrarObrigacoes());

export { publicarJob } from './publicar';
export type { NomeJob } from './publicar';
