"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { EmAlta } from "@/components/feed/EmAlta";
import { ListaPodeTeEnsinar } from "@/components/feed/PodeTeEnsinar";
import { Icone } from "@/components/ui/Icone";
import type { Match } from "@/lib/api";
import { formatarTempoEstudado, type HabilidadeEmAlta, type MeuProgresso } from "@/lib/posts";

const DIAS_DA_SEMANA = 7;

// Bloco numerado da coluna: régua em cima e "01 · Título" em mono, sem cartão nem sombra.
function Bloco({ numero, titulo, acao, children }: { numero: string; titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`bloco-${numero}`} className="border-t border-linha pt-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id={`bloco-${numero}`} className="text-[0.8125rem] text-texto-2 font-semibold">
          <span className="font-mono font-medium text-marca-forte numeros">{numero}</span> · {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

function CampoBusca() {
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
        <Icone nome="busca" tamanho={16} />
      </span>
      <input
        id="busca-lateral"
        type="search"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder="Buscar pessoas, posts, habilidades"
        className="h-10 w-full rounded-controle border border-linha bg-superficie pl-9 pr-3 text-[0.9375rem] text-texto placeholder:text-texto-3 focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none"
      />
    </form>
  );
}

function SuaSemana({ progresso }: { progresso: MeuProgresso }) {
  const cheios = Math.min(progresso.streak, DIAS_DA_SEMANA);
  return (
    <div>
      <p className="font-mono text-4xl font-medium tracking-[-0.02em] text-texto numeros">
        {formatarTempoEstudado(progresso.minutos_semana)}
      </p>
      <p className="mt-1 text-sm text-texto-2">
        estudadas nesta semana em <span className="font-mono numeros">{progresso.posts_semana}</span>{" "}
        {progresso.posts_semana === 1 ? "post" : "posts"}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {Array.from({ length: DIAS_DA_SEMANA }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-[1px] ${i < cheios ? "bg-marca" : "bg-texto-3/40"}`} />
          ))}
        </div>
        <span className="font-mono text-xs text-texto-2 numeros">
          {progresso.streak}d<span className="sr-only"> seguidos postando</span>
        </span>
      </div>
    </div>
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
    <aside aria-label="Sua semana e descobertas" className="sticky top-8 hidden space-y-6 self-start lg:block">
      <CampoBusca />

      {progresso && (
        <Bloco numero="01" titulo="Sua semana">
          <SuaSemana progresso={progresso} />
        </Bloco>
      )}

      {emAlta && (
        <Bloco numero="02" titulo="Mais estudadas">
          <EmAlta habilidades={emAlta} />
        </Bloco>
      )}

      {pessoas && pessoas.length > 0 && (
        <Bloco
          numero="03"
          titulo="Pode te ensinar"
          acao={
            <Link href="/matches" className="text-xs text-marca-forte hover:underline">
              Ver todos
            </Link>
          }
        >
          <ListaPodeTeEnsinar pessoas={pessoas} />
        </Bloco>
      )}
    </aside>
  );
}
