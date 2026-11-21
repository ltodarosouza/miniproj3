"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { deixarDeSeguir, estadoFollow, seguir, type EstadoFollow } from "@/lib/api";
import { meuId } from "@/lib/sessao";

export function BotaoSeguir({
  username,
  seguindoInicial,
  tamanho = "md",
  aoMudar,
}: {
  username: string;
  seguindoInicial?: boolean | null;
  tamanho?: "sm" | "md";
  aoMudar?: (estado: EstadoFollow) => void;
}) {
  const router = useRouter();
  const [logado, setLogado] = useState<boolean | null>(null);
  const [seguindo, setSeguindo] = useState<boolean | null>(seguindoInicial ?? null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setLogado(meuId() !== null);
  }, []);

  useEffect(() => {
    if (typeof seguindoInicial === "boolean") {
      setSeguindo(seguindoInicial);
      return;
    }
    if (!logado) return;
    let ativo = true;
    estadoFollow(username)
      .then((estado) => ativo && setSeguindo(estado.seguindo))
      .catch(() => ativo && setSeguindo(false));
    return () => {
      ativo = false;
    };
  }, [username, seguindoInicial, logado]);

  if (logado === null) return null;

  if (!logado) {
    return (
      <Botao tamanho={tamanho} onClick={() => router.push("/login")}>
        Seguir
      </Botao>
    );
  }

  async function alternar() {
    setCarregando(true);
    setErro(null);
    try {
      const estado = seguindo ? await deixarDeSeguir(username) : await seguir(username);
      setSeguindo(estado.seguindo);
      aoMudar?.(estado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "não deu certo, tente de novo");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Botao
        variante={seguindo ? "secundario" : "primario"}
        tamanho={tamanho}
        carregando={carregando || seguindo === null}
        onClick={alternar}
        aria-pressed={seguindo ?? undefined}
      >
        {seguindo ? "Seguindo" : "Seguir"}
      </Botao>
      {erro && (
        <span role="alert" className="text-xs text-perigo">
          {erro}
        </span>
      )}
    </span>
  );
}
