"use client";

import { useState, type ComponentProps } from "react";

import { Campo } from "@/components/ui/Campo";

type Props = Omit<ComponentProps<typeof Campo>, "type" | "acao" | "rotulo"> & {
  rotulo?: string;
};

export function CampoDeSenha({ rotulo = "Senha", ...resto }: Props) {
  const [visivel, setVisivel] = useState(false);

  return (
    <Campo
      {...resto}
      rotulo={rotulo}
      type={visivel ? "text" : "password"}
      acao={
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-pressed={visivel}
          className="rounded-controle px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-2 transition-colors hover:text-texto"
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
