import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, type Page, type User } from "@/lib/api";
import { meuId } from "@/lib/sessao";

export type TipoNotificacao = "curtida" | "comentario" | "seguidor" | "troca_proposta" | "troca_confirmada" | "troca_recusada" | "avaliacao";

export type Notificacao = {
  tipo: TipoNotificacao;
  em: string;
  ator: User;
  post_id: number | null;
  troca_id: number | null;
  texto_curto: string;
  lida: boolean;
};

export type GrupoData = "Hoje" | "Esta semana" | "Antes";

export function listarNotificacoes(offset = 0, limit = 50): Promise<Page<Notificacao>> {
  return apiGet(`/notificacoes?offset=${offset}&limit=${limit}`);
}

export async function contarNaoLidas(): Promise<number> {
  const resposta = await apiGet<{ total: number }>("/notificacoes/nao-lidas");
  return resposta.total;
}

export function marcarLidas(): Promise<void> {
  return apiPost("/notificacoes/lidas");
}

export function linkDaNotificacao(n: Notificacao): string {
  if (n.tipo === "curtida" || n.tipo === "comentario") return `/posts/${n.post_id}`;
  if (n.tipo === "seguidor") return `/perfil/${encodeURIComponent(n.ator.username)}`;
  return `/mensagens/${encodeURIComponent(n.ator.username)}`;
}

export function textoDoToast(n: Notificacao): string {
  const prefixo = `${n.ator.name} `;
  if (!n.texto_curto.startsWith(prefixo)) return n.texto_curto;
  return `@${n.ator.username} ${n.texto_curto.slice(prefixo.length)}`;
}

export function grupoDaData(iso: string): GrupoData {
  const data = new Date(iso);
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const dias = Math.floor((inicioHoje.getTime() - inicioData.getTime()) / 86400000);
  if (dias === 0) return "Hoje";
  if (dias > 0 && dias < 7) return "Esta semana";
  return "Antes";
}

export function useNotificacoes(): { naoLidas: number; ultimaNova: Notificacao | null; dispensar: () => void } {
  const [naoLidas, setNaoLidas] = useState(0);
  const [ultimaNova, setUltimaNova] = useState<Notificacao | null>(null);
  const totalConhecido = useRef<number | null>(null);

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let ativa = true;

    const consultar = async () => {
      if (meuId() === null) {
        totalConhecido.current = null;
        setNaoLidas(0);
        return;
      }
      try {
        const total = await contarNaoLidas();
        if (!ativa) return;
        const anterior = totalConhecido.current;
        totalConhecido.current = total;
        setNaoLidas(total);
        if (anterior !== null && total > anterior) {
          const pagina = await listarNotificacoes(0, 1);
          if (!ativa) return;
          const notificacao = pagina.items[0];
          if (!notificacao) return;
          setUltimaNova(notificacao);
          if (
            document.visibilityState !== "visible" &&
            notificacao.tipo === "troca_proposta" &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            new Notification("Nova proposta de troca", { body: notificacao.texto_curto });
          }
        }
      } catch {
      }
    };

    const configurarIntervalo = () => {
      if (intervalo) clearInterval(intervalo);
      intervalo = undefined;
      if (document.visibilityState === "visible") {
        intervalo = setInterval(() => void consultar(), 15000);
      } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        intervalo = setInterval(() => void consultar(), 60000);
      }
    };

    const aoMudarVisibilidade = () => {
      configurarIntervalo();
      if (document.visibilityState === "visible") void consultar();
    };

    void consultar();
    configurarIntervalo();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      ativa = false;
      if (intervalo) clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, []);

  const dispensar = useCallback(() => setUltimaNova(null), []);

  return { naoLidas, ultimaNova, dispensar };
}
