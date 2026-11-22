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
          className="rounded-controle px-2 py-1 text-sm font-medium text-texto-2 transition-colors hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca"
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
