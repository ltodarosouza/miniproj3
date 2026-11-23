export function Esqueleto({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`esqueleto block rounded-controle ${className ?? ""}`}
    />
  );
}

export function EsqueletoPost() {
  return (
    <div className="rounded-cartao border border-linha bg-superficie p-4 shadow-cartao">
      <div className="flex items-center gap-3">
        <Esqueleto className="size-10 rounded-full" />
        <div className="flex flex-col gap-2">
          <Esqueleto className="h-3.5 w-32" />
          <Esqueleto className="h-3 w-20" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Esqueleto className="h-3.5 w-full" />
        <Esqueleto className="h-3.5 w-11/12" />
        <Esqueleto className="h-3.5 w-2/3" />
      </div>
      <Esqueleto className="mt-4 h-6 w-24 rounded-full" />
    </div>
  );
}

export function EsqueletoLista({ itens = 3 }: { itens?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-4">
      {Array.from({ length: itens }, (_, indice) => (
        <EsqueletoPost key={indice} />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
