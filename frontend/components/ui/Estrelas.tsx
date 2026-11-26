"use client";

import { useState } from "react";

import { Icone } from "./Icone";

export function Estrelas({
  valor,
  aoMudar,
  tamanho = 18,
}: {
  valor: number;
  aoMudar?: (estrelas: number) => void;
  tamanho?: number;
}) {
  const [sobre, setSobre] = useState<number | null>(null);
  const ativo = sobre ?? valor;

  if (!aoMudar) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${valor.toFixed(1)} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icone
            key={n}
            nome="estrela"
            tamanho={tamanho}
            preenchido={n <= Math.round(valor)}
            className={n <= Math.round(valor) ? "stroke-texto-2 fill-estrela" : "stroke-texto-2"}
          />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Avaliação" onPointerLeave={() => setSobre(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onPointerEnter={() => setSobre(n)}
          onClick={() => aoMudar(n)}
          className="rounded-controle p-0.5 transition-transform duration-[var(--rapido)] ease-saida hover:scale-110 active:scale-95"
        >
          <Icone
            nome="estrela"
            tamanho={tamanho + 6}
            preenchido={n <= ativo}
            className={`transition-colors duration-[var(--rapido)] stroke-texto-2 ${n <= ativo ? "fill-estrela" : ""}`}
          />
        </button>
      ))}
    </span>
  );
}
