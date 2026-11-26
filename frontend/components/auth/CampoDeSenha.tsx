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
          className="rounded-controle px-2 py-1 text-[0.8125rem] text-texto-2 transition-colors hover:text-texto font-semibold"
        >
          {visivel ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
