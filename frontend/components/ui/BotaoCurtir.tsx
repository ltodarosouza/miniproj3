"use client";

import { useState } from "react";

import { Icone } from "./Icone";

export function BotaoCurtir({
  curtido,
  total,
  aoAlternar,
}: {
  curtido: boolean;
  total: number;
  aoAlternar: () => void;
}) {
  const [pulso, setPulso] = useState(0);

  return (
    <button
      type="button"
      aria-pressed={curtido}
      aria-label={curtido ? "Descurtir" : "Curtir"}
      onClick={() => {
        if (!curtido) setPulso((p) => p + 1);
        aoAlternar();
      }}
      className={`group inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm transition-colors duration-[var(--rapido)] ${
        curtido ? "text-perigo" : "text-texto-3 hover:bg-superficie-2 hover:text-perigo"
      }`}
    >
      <span key={pulso} className={pulso ? "[animation:pulsar-coracao_520ms_var(--ease-mola)]" : ""}>
        <Icone nome="coracao" tamanho={18} preenchido={curtido} />
      </span>
      <span className="numeros">{total}</span>
    </button>
  );
}
