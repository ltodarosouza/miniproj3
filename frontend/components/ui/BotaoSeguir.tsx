"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { deixarDeSeguir, ErroApi, estadoFollow, seguir, type EstadoFollow } from "@/lib/api";
import { meuId } from "@/lib/sessao";
import { vibrar } from "@/lib/movimento";

function naoAutenticado(err: unknown): boolean {
  return err instanceof ErroApi && err.status === 401;
}

export function BotaoSeguir({
  username,
  seguindoInicial,
  tamanho = "md",
  sobreGrafite = false,
  aoMudar,
}: {
  username: string;
  seguindoInicial?: boolean | null;
  tamanho?: "sm" | "md";
  // Na faixa grafite do perfil o contorno usa a cor clara da faixa.
  sobreGrafite?: boolean;
  aoMudar?: (estado: EstadoFollow) => void;
}) {
  const router = useRouter();
  const [logado, setLogado] = useState<boolean | null>(null);
  const [seguindo, setSeguindo] = useState<boolean | null>(seguindoInicial ?? null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

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
    setErro(null);
    estadoFollow(username)
      .then((estado) => {
        if (ativo) setSeguindo(estado.seguindo);
      })
      .catch((err) => {
        if (!ativo) return;
        if (naoAutenticado(err)) setLogado(false);
        else setErro("não consegui ver se você segue");
      });
    return () => {
      ativo = false;
    };
  }, [username, seguindoInicial, logado, tentativa]);

  if (logado === null) return null;

  // Sempre contorno: seguir é ação secundária ao lado de "Propor troca", que fica em mel.
  const contorno = sobreGrafite
    ? "border-grafite-texto/50! text-grafite-texto! hover:border-grafite-texto!"
    : "";

  if (!logado) {
    return (
      <Botao variante="secundario" tamanho={tamanho} className={contorno} onClick={() => router.push("/login")}>
        Seguir
      </Botao>
    );
  }

  if (seguindo === null && erro) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <Botao variante="secundario" tamanho={tamanho} className={contorno} onClick={() => setTentativa((t) => t + 1)}>
          Tentar de novo
        </Botao>
        <span role="alert" className="text-xs text-perigo">
          {erro}
        </span>
      </span>
    );
  }

  async function alternar() {
    setCarregando(true);
    setErro(null);
    try {
      const estado = seguindo ? await deixarDeSeguir(username) : await seguir(username);
      if (!seguindo) vibrar(10);
      setSeguindo(estado.seguindo);
      aoMudar?.(estado);
    } catch (err) {
      if (naoAutenticado(err)) setLogado(false);
      else setErro(err instanceof ErroApi ? err.message : "sem conexão, tente de novo");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Botao
        variante="secundario"
        tamanho={tamanho}
        className={contorno}
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
