"use client";

import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { deixarDeSeguir, estadoFollow, seguir } from "@/lib/api";

export function BotaoSeguirDeVolta({ username, nome }: { username: string; nome: string }) {
  const [seguindo, setSeguindo] = useState<boolean | null>(null);
  const [buscaFalhou, setBuscaFalhou] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    estadoFollow(username)
      .then((estado) => {
        if (ativo) setSeguindo(estado.seguindo);
      })
      .catch(() => {
        if (ativo) setBuscaFalhou(true);
      });
    return () => {
      ativo = false;
    };
  }, [username]);

  if (buscaFalhou) return null;

  if (seguindo === null) {
    return (
      <Botao variante="secundario" tamanho="sm" carregando>
        Seguir de volta
      </Botao>
    );
  }

  async function alternar() {
    setCarregando(true);
    setErro(false);
    try {
      const estado = seguindo ? await deixarDeSeguir(username) : await seguir(username);
      setSeguindo(estado.seguindo);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Botao
        variante={seguindo ? "secundario" : "primario"}
        tamanho="sm"
        carregando={carregando}
        onClick={alternar}
        aria-label={seguindo ? `Seguindo ${nome}` : `Seguir de volta ${nome}`}
        aria-pressed={seguindo}
      >
        {seguindo ? "Seguindo" : "Seguir de volta"}
      </Botao>
      {erro && (
        <span role="alert" className="font-mono text-[11px] text-perigo">
          sem conexão, tente de novo
        </span>
      )}
    </span>
  );
}
