"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BotaoLink } from "@/components/ui/Botao";
import { NOME_REDE } from "@/lib/marca";
import { temToken } from "@/lib/sessao";

const PARES = [
  ["Git", "Python"],
  ["Cálculo 1", "Inglês técnico"],
  ["React", "SQL"],
  ["Algoritmos", "C++"],
  ["Figma", "JavaScript"],
  ["Estatística", "Excel"],
  ["Docker", "Linux"],
  ["Física 1", "Redação"],
] as const;

const PASSOS = [
  {
    numero: "01",
    titulo: "Diga o que sabe",
    descricao: "Liste as habilidades que você domina e as que quer aprender.",
  },
  {
    numero: "02",
    titulo: "Encontre o par",
    descricao: "O Colmatch cruza as listas e mostra quem sabe o que você procura e procura o que você sabe.",
  },
  {
    numero: "03",
    titulo: "Marque a troca",
    descricao: "Combinem pela conversa, agendem um horário e avaliem depois. Sem dinheiro no meio.",
  },
] as const;

function TickerDePares() {
  const [pausado, setPausado] = useState(false);
  const itens = PARES.map(([a, b]) => `${a} ↔ ${b}`);

  return (
    <div
      role="region"
      aria-label="Exemplos de pares de troca"
      className={`ticker-pares relative flex items-center overflow-hidden border-y border-linha ${pausado ? "ticker-pares-pausado" : ""}`}
    >
      <style>{`
        @keyframes ticker-pares-deslizar { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-pares-faixa { animation: ticker-pares-deslizar 60s linear infinite; }
        .ticker-pares:hover .ticker-pares-faixa, .ticker-pares-pausado .ticker-pares-faixa { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ticker-pares-faixa { animation: none; } .ticker-pares-botao { display: none; } }
      `}</style>
      <ul className="sr-only">
        {itens.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="min-w-0 flex-1 overflow-hidden py-3">
        <div aria-hidden="true" className="ticker-pares-faixa flex w-max">
          {[0, 1].map((copia) => (
            <div key={copia} className="flex shrink-0">
              {itens.map((item) => (
                <span key={item} className="whitespace-nowrap px-6 font-mono text-sm text-texto-2 numeros">
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPausado((atual) => !atual)}
        aria-pressed={pausado}
        className="ticker-pares-botao shrink-0 border-l border-linha bg-fundo px-3 py-3 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-2 hover:text-texto"
      >
        {pausado ? "Continuar" : "Pausar"}
      </button>
    </div>
  );
}

export default function Inicio() {
  const router = useRouter();
  const [apresentar, setApresentar] = useState<boolean | null>(null);

  useEffect(() => {
    if (temToken()) {
      router.replace("/feed");
      return;
    }
    setApresentar(true);
  }, [router]);

  if (apresentar !== true) return <div className="min-h-[60vh]" />;

  return (
    <div className="mx-auto max-w-5xl">
      <section className="py-12 sm:py-20">
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-texto sm:text-6xl">
          Troque o que você sabe pelo que você quer aprender.
        </h1>
        <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-texto-2">
          No {NOME_REDE}, você diz o que sabe e o que quer aprender. A gente mostra quem pode te
          ensinar e com quem dá para trocar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <BotaoLink href="/cadastro">Criar conta</BotaoLink>
          <BotaoLink href="/login" variante="secundario">
            Já tenho conta
          </BotaoLink>
        </div>
      </section>

      <TickerDePares />

      <section aria-labelledby="como-funciona" className="py-12 sm:py-16">
        <h2 id="como-funciona" className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-texto-3">
          Como funciona
        </h2>
        <ol className="mt-6 border-t border-linha">
          {PASSOS.map((passo) => (
            <li
              key={passo.numero}
              className="grid gap-1 border-b border-linha py-5 sm:grid-cols-[4rem_14rem_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="font-mono text-sm text-marca-forte numeros">{passo.numero}</span>
              <h3 className="font-display text-xl font-semibold tracking-tight text-texto">{passo.titulo}</h3>
              <p className="text-[0.9375rem] leading-relaxed text-texto-2">{passo.descricao}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-linha py-6 text-sm text-texto-3">
        <span>{NOME_REDE} · troca de conhecimento entre estudantes</span>
        <span className="font-mono text-xs">Projeto acadêmico</span>
      </footer>
    </div>
  );
}
