export default function PaginaDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Indicadores e resumo das obrigações, tarefas e atendimentos do escritório.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { titulo: 'Empresas ativas', valor: '—' },
          { titulo: 'Tarefas pendentes', valor: '—' },
          { titulo: 'Tarefas atrasadas', valor: '—' },
          { titulo: 'Conversas abertas', valor: '—' },
        ].map((card) => (
          <div key={card.titulo} className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">{card.titulo}</div>
            <div className="mt-2 text-3xl font-bold">{card.valor}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
