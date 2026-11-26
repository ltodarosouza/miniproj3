"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiGet, ErroApi } from "@/lib/api";
import { meuId } from "@/lib/sessao";

export type NaoLidas = { mensagens: number | null; notificacoes: number | null };

type TotalNaoLidas = { total: number };

export function useSelos(): NaoLidas {
  const caminho = usePathname();
  const [naoLidas, setNaoLidas] = useState<NaoLidas>({ mensagens: null, notificacoes: null });
  const mensagensIndisponiveis = useRef(false);
  const notificacoesIndisponiveis = useRef(false);
  const montado = useRef(false);
  const ultimaMensagens = useRef(0);
  const ultimaNotificacoes = useRef(0);

  const consultar = useCallback(async () => {
    if (meuId() === null) {
      setNaoLidas({ mensagens: null, notificacoes: null });
      return;
    }

    const consultarMensagens = async () => {
      if (mensagensIndisponiveis.current) return;
      const pedido = ++ultimaMensagens.current;
      try {
        const resposta = await apiGet<TotalNaoLidas>("/dms/nao-lidas");
        if (montado.current && pedido === ultimaMensagens.current) setNaoLidas((atual) => ({ ...atual, mensagens: resposta.total }));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 404) mensagensIndisponiveis.current = true;
        if (montado.current && pedido === ultimaMensagens.current) setNaoLidas((atual) => ({ ...atual, mensagens: null }));
      }
    };

    const consultarNotificacoes = async () => {
      if (notificacoesIndisponiveis.current) return;
      const pedido = ++ultimaNotificacoes.current;
      try {
        const resposta = await apiGet<TotalNaoLidas>("/notificacoes/nao-lidas");
        if (montado.current && pedido === ultimaNotificacoes.current) setNaoLidas((atual) => ({ ...atual, notificacoes: resposta.total }));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 404) notificacoesIndisponiveis.current = true;
        if (montado.current && pedido === ultimaNotificacoes.current) setNaoLidas((atual) => ({ ...atual, notificacoes: null }));
      }
    };

    await Promise.all([consultarMensagens(), consultarNotificacoes()]);
  }, []);

  useEffect(() => {
    montado.current = true;
    void consultar();

    const intervalo = window.setInterval(() => {
      if (document.visibilityState === "visible") void consultar();
    }, 15_000);
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") void consultar();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      montado.current = false;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [consultar, caminho]);

  return naoLidas;
}
