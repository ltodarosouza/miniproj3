"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import type { Match } from "@/lib/api";

function Pessoa({ match, compacto }: { match: Match; compacto?: boolean }) {
  const { usuario, me_ensina } = match;
  const perfil = `/perfil/${encodeURIComponent(usuario.username)}`;
  return (
    <div
      className={
        compacto
          ? "flex h-full w-44 flex-col items-center gap-2 rounded-cartao border border-linha bg-superficie p-4 text-center"
          : "flex items-center gap-3"
      }
    >
      <Link href={perfil} tabIndex={-1} aria-hidden="true">
        <Avatar nome={usuario.name} url={usuario.avatar_url} tamanho={compacto ? "lg" : "md"} />
      </Link>
      <div className="w-full min-w-0 flex-1">
        <Link href={perfil} className="block truncate text-sm font-medium text-texto hover:underline">
          {usuario.name}
        </Link>
        <p className="truncate text-xs text-texto-3">
          {me_ensina.length ? `Ensina ${me_ensina.map((h) => h.nome).join(", ")}` : `@${usuario.username}`}
        </p>
      </div>
      <Link
        href={`/mensagens/${encodeURIComponent(usuario.username)}`}
        className="inline-flex h-8 shrink-0 items-center rounded-full border border-linha-forte px-3 text-sm font-medium text-texto transition-colors duration-[var(--rapido)] hover:border-marca hover:text-marca-forte motion-reduce:transition-none"
      >
        Conversar
      </Link>
    </div>
  );
}

export function ListaPodeTeEnsinar({ pessoas }: { pessoas: Match[] }) {
  return (
    <ul className="space-y-3">
      {pessoas.map((match) => (
        <li key={match.usuario.id}>
          <Pessoa match={match} />
        </li>
      ))}
    </ul>
  );
}

export function CarrosselPodeTeEnsinar({ pessoas }: { pessoas: Match[] }) {
  if (!pessoas.length) return null;
  return (
    <section aria-labelledby="carrossel-ensinar" className="min-w-0 space-y-3 lg:hidden">
      <div className="flex items-baseline justify-between">
        <h2 id="carrossel-ensinar" className="text-sm font-semibold text-texto">
          Pode te ensinar
        </h2>
        <Link href="/matches" className="text-sm text-marca-forte hover:underline">
          Ver todos
        </Link>
      </div>
      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {pessoas.map((match) => (
          <li key={match.usuario.id} className="shrink-0 snap-start">
            <Pessoa match={match} compacto />
          </li>
        ))}
      </ul>
    </section>
  );
}
