import Link from "next/link";

import { formatarTempoEstudado, type HabilidadeEmAlta } from "@/lib/posts";

export function EmAlta({ habilidades }: { habilidades: HabilidadeEmAlta[] }) {
  if (!habilidades.length) {
    return <p className="text-sm text-texto-3">Ninguém marcou habilidade nos posts desta semana ainda.</p>;
  }
  return (
    <ol className="space-y-1">
      {habilidades.map((h, i) => (
        <li key={h.id}>
          <Link
            href={`/busca/habilidades/${h.id}`}
            className="-mx-2 flex items-baseline gap-3 rounded-controle px-2 py-1.5 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
          >
            <span className="numeros w-4 text-sm text-texto-3">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-texto">{h.nome}</span>
              <span className="numeros text-xs text-texto-3">
                {h.posts} {h.posts === 1 ? "post" : "posts"}
                {h.minutos > 0 && ` · ${formatarTempoEstudado(h.minutos)}`}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
