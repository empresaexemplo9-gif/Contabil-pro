/**
 * Template engine minimalista — substitui `{{ caminho.aninhado }}` pelo
 * valor correspondente no contexto. Caminhos não resolvidos viram string
 * vazia.
 */
export function aplicarTemplate(texto: string, contexto: Record<string, unknown>): string {
  return texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, caminho: string) => {
    const valor = resolverCaminho(contexto, caminho);
    return valor == null ? '' : String(valor);
  });
}

export function aplicarTemplateObjeto<T extends object>(
  obj: T,
  contexto: Record<string, unknown>,
): T {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(obj)) {
    if (typeof valor === 'string') {
      saida[chave] = aplicarTemplate(valor, contexto);
    } else if (valor !== null && typeof valor === 'object' && !Array.isArray(valor)) {
      saida[chave] = aplicarTemplateObjeto(valor as Record<string, unknown>, contexto);
    } else {
      saida[chave] = valor;
    }
  }
  return saida as T;
}

function resolverCaminho(obj: Record<string, unknown>, caminho: string): unknown {
  return caminho.split('.').reduce<unknown>((acc, parte) => {
    if (acc && typeof acc === 'object' && parte in (acc as object)) {
      return (acc as Record<string, unknown>)[parte];
    }
    return undefined;
  }, obj);
}
