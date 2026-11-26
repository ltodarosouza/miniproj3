"use client";

import { useEffect, useState } from "react";

import { aplicarTema, temaAtual, type Tema } from "@/lib/tema";

import { Icone } from "./Icone";

export function BotaoTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaAtual());
  }, []);

  if (tema === null) {
    return <span className="size-9" aria-hidden="true" />;
  }

  const rotulo = tema === "claro" ? "Usar tema escuro" : "Usar tema claro";

  function alternarTema() {
    const proximo = tema === "claro" ? "escuro" : "claro";
    aplicarTema(proximo);
    setTema(proximo);
  }

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={rotulo}
      title={rotulo}
      className="inline-flex size-9 items-center justify-center rounded-controle border border-transparent text-texto-2 hover:border-linha hover:text-texto transition-colors duration-[var(--rapido)] motion-reduce:transition-none"
    >
      <Icone nome={tema === "claro" ? "lua" : "sol"} tamanho={18} />
    </button>
  );
}
