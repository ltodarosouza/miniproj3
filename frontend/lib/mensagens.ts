"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { apiGet, apiPost, ErroApi, type Mensagem, type User } from "@/lib/api";
import { meuId } from "@/lib/sessao";

const SEM_REDIRECIONAR = { redirecionarNo401: false } as const;

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
  return apiPost(`/dms/${encodeURIComponent(username)}/lidas`, undefined, SEM_REDIRECIONAR);
}

export function enviarMensagemComId(username: string, texto: string, clienteId: string): Promise<Mensagem & { cliente_id?: string | null; entregue_em?: string | null; lida_em?: string | null }> {
  return apiPost(`/dms/${encodeURIComponent(username)}`, { texto, cliente_id: clienteId }, SEM_REDIRECIONAR);
}

export function useNaoLidas() {
  const [dados, setDados] = useState<NaoLidasMensagens | null>(null);
  const [indisponivel, setIndisponivel] = useState(false);
  const pedido = useRef(0);
  const porConversaAnterior = useRef<Record<string, number> | null>(null);

  const atualizar = useCallback(async () => {
    const numero = ++pedido.current;
    const usuario = meuId();
    try {
      const resposta = await buscarNaoLidas();
      if (numero !== pedido.current || usuario !== meuId()) return;
      const mapaAnterior = porConversaAnterior.current;
      porConversaAnterior.current = resposta.por_conversa;
      setDados(resposta);
      if (mapaAnterior !== null && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
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
        }
      }
    } catch (erro) {
      if (numero !== pedido.current) return;
      const usuarioAtual = meuId();
      if (erro instanceof ErroApi && erro.status === 401 && (usuarioAtual === null || usuario === usuarioAtual)) {
        setDados(null);
        setIndisponivel(true);
        return;
      }
      if (usuario !== usuarioAtual) return;
      if (erro instanceof ErroApi && erro.status === 404) setIndisponivel(true);
      else setDados(null);
    }
  }, []);

  useEffect(() => {
    if (indisponivel) return;
    let ativo = true;
    void atualizar();
    let temporizador: number;
    const agendar = () => {
      if (!ativo) return;
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(async () => {
        await atualizar();
        if (ativo) agendar();
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
    return () => { ativo = false; pedido.current++; window.clearTimeout(temporizador); document.removeEventListener("visibilitychange", visibilidade); };
  }, [atualizar, indisponivel]);

  return dados;
}

export function useTituloMensagens(total: number | null) {
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = total ? `(${total}) ${original}` : original;
    return () => { document.title = original; };
  }, [total]);
}
