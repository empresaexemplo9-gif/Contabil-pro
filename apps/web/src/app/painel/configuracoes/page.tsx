'use client';

import { useState } from 'react';

import { AbaEscritorio } from './aba-escritorio';
import { AbaEquipe } from './aba-equipe';
import { AbaIntegracoes } from './aba-integracoes';
import { AbaAuditoria } from './aba-auditoria';

type ChaveAba = 'escritorio' | 'equipe' | 'integracoes' | 'auditoria';

const ABAS: Array<{ chave: ChaveAba; titulo: string }> = [
  { chave: 'escritorio', titulo: 'Escritório' },
  { chave: 'equipe', titulo: 'Equipe' },
  { chave: 'integracoes', titulo: 'Integrações' },
  { chave: 'auditoria', titulo: 'Auditoria' },
];

export default function PaginaConfiguracoes() {
  const [aba, setAba] = useState<ChaveAba>('escritorio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Equipe, papéis, integrações e dados do escritório.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b">
        {ABAS.map((item) => (
          <button
            key={item.chave}
            onClick={() => setAba(item.chave)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
              aba === item.chave
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.titulo}
          </button>
        ))}
      </div>

      <div>
        {aba === 'escritorio' && <AbaEscritorio />}
        {aba === 'equipe' && <AbaEquipe />}
        {aba === 'integracoes' && <AbaIntegracoes />}
        {aba === 'auditoria' && <AbaAuditoria />}
      </div>
    </div>
  );
}
