"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiGet, ErroApi, trocasPendentesAvaliacao } from "@/lib/api";
import { meuId } from "@/lib/sessao";
import { EVENTO_AVALIACAO_ENVIADA } from "@/lib/avaliacoes";

export type NaoLidas = { mensagens: number | null; notificacoes: number | null; avaliacoes: number | null };

type TotalNaoLidas = { total: number };

export function rotuloMensagens(naoLidas: NaoLidas): string {
  const { mensagens, avaliacoes } = naoLidas;
  const partes: string[] = [];
  if (mensagens !== null && mensagens > 0) partes.push(`${mensagens} ${mensagens === 1 ? "não lida" : "não lidas"}`);
  if (avaliacoes !== null && avaliacoes > 0) partes.push(`${avaliacoes} ${avaliacoes === 1 ? "avaliação pendente" : "avaliações pendentes"}`);
  return partes.length ? `Mensagens, ${partes.join(", ")}` : "Mensagens";
}

export function totalMensagens(naoLidas: NaoLidas): number | null {
  if (naoLidas.mensagens === null && naoLidas.avaliacoes === null) return null;
  return (naoLidas.mensagens ?? 0) + (naoLidas.avaliacoes ?? 0);
}

export function useSelos(): NaoLidas {
  const caminho = usePathname();
  const [naoLidas, setNaoLidas] = useState<NaoLidas>({ mensagens: null, notificacoes: null, avaliacoes: null });
  const mensagensIndisponiveis = useRef(false);
  const notificacoesIndisponiveis = useRef(false);
  const avaliacoesIndisponiveis = useRef(false);
  const montado = useRef(false);
  const ultimaMensagens = useRef(0);
  const ultimaNotificacoes = useRef(0);
  const ultimaAvaliacoes = useRef(0);

  const consultar = useCallback(async () => {
    if (meuId() === null) {
      setNaoLidas({ mensagens: null, notificacoes: null, avaliacoes: null });
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

    const consultarAvaliacoes = async () => {
      if (avaliacoesIndisponiveis.current) return;
      const pedido = ++ultimaAvaliacoes.current;
      try {
        const resposta = await trocasPendentesAvaliacao();
        if (montado.current && pedido === ultimaAvaliacoes.current) setNaoLidas((atual) => ({ ...atual, avaliacoes: resposta.items.length }));
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 404) avaliacoesIndisponiveis.current = true;
        if (montado.current && pedido === ultimaAvaliacoes.current) setNaoLidas((atual) => ({ ...atual, avaliacoes: null }));
      }
    };

    await Promise.all([consultarMensagens(), consultarNotificacoes(), consultarAvaliacoes()]);
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
    window.addEventListener(EVENTO_AVALIACAO_ENVIADA, consultar);

    return () => {
      montado.current = false;
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener(EVENTO_AVALIACAO_ENVIADA, consultar);
    };
  }, [consultar, caminho]);

  return naoLidas;
}
