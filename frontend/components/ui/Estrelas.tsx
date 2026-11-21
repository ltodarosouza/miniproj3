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
      <span className="inline-flex items-center gap-0.5 text-estrela" role="img" aria-label={`${valor.toFixed(1)} de 5 estrelas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icone key={n} nome="estrela" tamanho={tamanho} preenchido={n <= Math.round(valor)} className={n <= Math.round(valor) ? "" : "text-linha-forte"} />
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
          className="rounded-md p-0.5 transition-transform duration-[var(--medio)] ease-mola hover:scale-125 active:scale-95"
          style={{ transitionDelay: sobre !== null && n <= ativo ? `${n * 25}ms` : "0ms" }}
        >
          <Icone
            nome="estrela"
            tamanho={tamanho + 6}
            preenchido={n <= ativo}
            className={`transition-colors duration-[var(--rapido)] ${n <= ativo ? "text-estrela" : "text-linha-forte"}`}
          />
        </button>
      ))}
    </span>
  );
}
