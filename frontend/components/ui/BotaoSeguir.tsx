"use client";

import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { deixarDeSeguir, estadoFollow, seguir, type EstadoFollow } from "@/lib/api";

export function BotaoSeguir({
  username,
  tamanho = "md",
  aoMudar,
}: {
  username: string;
  tamanho?: "sm" | "md";
  aoMudar?: (estado: EstadoFollow) => void;
}) {
  const [seguindo, setSeguindo] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    estadoFollow(username)
      .then((estado) => setSeguindo(estado.seguindo))
      .catch(() => setSeguindo(null));
  }, [username]);

  if (seguindo === null) return null;

  async function alternar() {
    setCarregando(true);
    try {
      const estado = seguindo ? await deixarDeSeguir(username) : await seguir(username);
      setSeguindo(estado.seguindo);
      aoMudar?.(estado);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Botao
      variante={seguindo ? "secundario" : "primario"}
      tamanho={tamanho}
      carregando={carregando}
      onClick={alternar}
      aria-pressed={seguindo}
    >
      {seguindo ? "Seguindo" : "Seguir"}
    </Botao>
  );
}
