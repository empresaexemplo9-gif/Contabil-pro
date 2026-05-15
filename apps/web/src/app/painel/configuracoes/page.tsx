'use client';

import { useState } from 'react';

import { AbaAuditoria } from './aba-auditoria';
import { AbaAutomacoes } from './aba-automacoes';
import { AbaEquipe } from './aba-equipe';
import { AbaEscritorio } from './aba-escritorio';
import { AbaIntegracoes } from './aba-integracoes';

type ChaveAba = 'escritorio' | 'equipe' | 'integracoes' | 'automacoes' | 'auditoria';

const ABAS: Array<{ chave: ChaveAba; titulo: string }> = [
  { chave: 'escritorio', titulo: 'Escritório' },
  { chave: 'equipe', titulo: 'Equipe' },
  { chave: 'integracoes', titulo: 'Integrações' },
  { chave: 'automacoes', titulo: 'Automações' },
  { chave: 'auditoria', titulo: 'Auditoria' },
];

export default function PaginaConfiguracoes() {
  const [aba, setAba] = useState<ChaveAba>('escritorio');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">Configurações</h1>
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
        {aba === 'automacoes' && <AbaAutomacoes />}
        {aba === 'auditoria' && <AbaAuditoria />}
      </div>
    </div>
  );
}
