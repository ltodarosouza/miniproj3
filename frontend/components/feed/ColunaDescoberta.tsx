"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { EmAlta } from "@/components/feed/EmAlta";
import { ListaPodeTeEnsinar } from "@/components/feed/PodeTeEnsinar";
import { Icone } from "@/components/ui/Icone";
import type { Match } from "@/lib/api";
import { formatarTempoEstudado, type HabilidadeEmAlta, type MeuProgresso } from "@/lib/posts";

function Bloco({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-cartao border border-linha bg-superficie p-4 shadow-cartao">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-texto">{titulo}</h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function CampoBusca() {
  const roteador = useRouter();
  const [termo, setTermo] = useState("");
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const limpo = termo.trim();
    roteador.push(limpo ? `/busca?q=${encodeURIComponent(limpo)}` : "/busca");
  }
  return (
    <form role="search" onSubmit={enviar} className="relative">
      <label htmlFor="busca-lateral" className="sr-only">
        Buscar pessoas, posts e habilidades
      </label>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-3">
        <Icone nome="busca" tamanho={17} />
      </span>
      <input
        id="busca-lateral"
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar pessoas, posts, habilidades"
        className="h-10 w-full rounded-full border border-linha bg-superficie pl-9 pr-4 text-[0.9375rem] text-texto placeholder:text-texto-3 focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none"
      />
    </form>
  );
}

export function ColunaDescoberta({
  pessoas,
  emAlta,
  progresso,
}: {
  pessoas: Match[] | null;
  emAlta: HabilidadeEmAlta[] | null;
  progresso: MeuProgresso | null;
}) {
  return (
    <aside aria-label="Descobrir" className="sticky top-8 hidden space-y-4 self-start lg:block">
      <CampoBusca />

      {progresso && (
        <Bloco titulo="Seu progresso">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-texto-3">Sequência</dt>
              <dd className="numeros flex items-center gap-1 text-lg font-semibold text-texto">
                <Icone nome="chama" tamanho={18} />
                {progresso.streak} {progresso.streak === 1 ? "dia" : "dias"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-texto-3">Nesta semana</dt>
              <dd className="numeros text-lg font-semibold text-texto">
                {formatarTempoEstudado(progresso.minutos_semana)}
              </dd>
            </div>
          </dl>
        </Bloco>
      )}

      {pessoas && pessoas.length > 0 && (
        <Bloco
          titulo="Pode te ensinar"
          acao={
            <Link href="/matches" className="text-sm text-marca-forte hover:underline">
              Ver todos
            </Link>
          }
        >
          <ListaPodeTeEnsinar pessoas={pessoas} />
        </Bloco>
      )}

      {emAlta && (
        <Bloco titulo="Em alta esta semana">
          <EmAlta habilidades={emAlta} />
        </Bloco>
      )}
    </aside>
  );
}
