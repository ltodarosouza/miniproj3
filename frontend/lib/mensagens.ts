"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiGet, apiPost, ErroApi, type User } from "@/lib/api";
import { meuId } from "@/lib/sessao";

export type ConversaComStatus = {
  com: User;
  ultima_mensagem: string;
  ultima_de_mim: boolean;
  em: string;
  ultimo_evento?: "mensagem" | "troca_proposta" | "troca_confirmada" | "troca_recusada";
  troca_data_hora?: string | null;
  nao_lidas?: number;
};

export type NaoLidasMensagens = { total: number; por_conversa: Record<string, number> };

export function listarConversasComStatus(): Promise<{ items: ConversaComStatus[] }> {
  return apiGet("/dms");
}

export function buscarNaoLidas(): Promise<NaoLidasMensagens> {
  return apiGet("/dms/nao-lidas");
}

export function marcarConversaLida(username: string): Promise<{ lidas_ate_id: number | null }> {
  return apiPost(`/dms/${encodeURIComponent(username)}/lidas`);
}

export function useNaoLidas() {
  const [dados, setDados] = useState<NaoLidasMensagens | null>(null);
  const [indisponivel, setIndisponivel] = useState(false);
  const pedido = useRef(0);
  const totalAnterior = useRef<number | null>(null);
  const porConversaAnterior = useRef<Record<string, number> | null>(null);

  const atualizar = useCallback(async () => {
    if (indisponivel) return;
    const numero = ++pedido.current;
    const usuario = meuId();
    try {
      const resposta = await buscarNaoLidas();
      if (numero !== pedido.current || usuario !== meuId()) return;
      const anterior = totalAnterior.current;
      const mapaAnterior = porConversaAnterior.current;
      totalAnterior.current = resposta.total;
      porConversaAnterior.current = resposta.por_conversa;
      setDados(resposta);
      if (anterior !== null && resposta.total > anterior && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const aumentos = Object.entries(resposta.por_conversa).filter(([username, quantidade]) => quantidade > (mapaAnterior?.[username] ?? 0));
        if (aumentos.length) {
          for (const [username] of aumentos) {
            const notificacao = new Notification(`Nova mensagem de @${username}`, { tag: `mensagem-${username}` });
            notificacao.onclick = () => {
              window.focus();
              window.location.href = `/mensagens/${encodeURIComponent(username)}`;
              notificacao.close();
            };
          }
        } else {
          const notificacao = new Notification(`Você tem ${resposta.total - anterior} mensagens novas`, { tag: "mensagens" });
          notificacao.onclick = () => { window.focus(); notificacao.close(); };
        }
      }
    } catch (erro) {
      if (numero !== pedido.current || usuario !== meuId()) return;
      if (erro instanceof ErroApi && erro.status === 404) setIndisponivel(true);
      else setDados(null);
    }
  }, [indisponivel]);

  useEffect(() => {
    void atualizar();
    let temporizador: number;
    const agendar = () => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(async () => {
        await atualizar();
        agendar();
      }, document.hidden ? 30000 : 10000);
    };
    agendar();
    const visibilidade = () => {
      if (!document.hidden) {
        void atualizar();
        agendar();
      } else agendar();
    };
    document.addEventListener("visibilitychange", visibilidade);
    return () => { pedido.current++; window.clearTimeout(temporizador); document.removeEventListener("visibilitychange", visibilidade); };
  }, [atualizar]);

  return dados;
}

export function useTituloMensagens(total: number | null) {
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total ? `(${total}) ${original}` : original;
    return () => { document.title = original; };
  }, [total]);
}
