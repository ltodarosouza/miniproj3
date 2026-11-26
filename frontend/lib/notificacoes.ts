import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet, apiPost, type Page, type User } from "@/lib/api";
import { formatarHora } from "@/lib/datas";
import { meuId } from "@/lib/sessao";

const DIA_SEMANA_CURTO = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const DIA_E_MES_CURTO = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

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

export async function listarNotificacoesAntesDe(
  antesDe: string,
  carregadas: number,
  limit = 50,
): Promise<Page<Notificacao>> {
  const resposta = await apiGet<Page<Notificacao>>(
    `/notificacoes?antes_de=${encodeURIComponent(antesDe)}&limit=${limit}`,
  );
  if (resposta.items.some((item) => new Date(item.em) >= new Date(antesDe))) {
    return listarNotificacoes(carregadas, limit);
  }
  return resposta;
}

export function chaveDaNotificacao(n: Notificacao): string {
  return `${n.tipo}-${n.em}-${n.ator.id}-${n.post_id ?? ""}-${n.troca_id ?? ""}`;
}

export type NaoLidas = { total: number; ultima_em: string | null };

export function consultarNaoLidas(): Promise<NaoLidas> {
  return apiGet<NaoLidas>("/notificacoes/nao-lidas");
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
  const hojeUtc = Date.UTC(inicioHoje.getFullYear(), inicioHoje.getMonth(), inicioHoje.getDate());
  const dataUtc = Date.UTC(inicioData.getFullYear(), inicioData.getMonth(), inicioData.getDate());
  const dias = Math.round((hojeUtc - dataUtc) / 86400000);
  if (dias === 0) return "Hoje";
  if (dias > 0 && dias < 7) return "Esta semana";
  return "Antes";
}

export type HorarioNotificacao = { hora: string; dia: string | null };

export function horarioDaNotificacao(iso: string): HorarioNotificacao {
  const grupo = grupoDaData(iso);
  const data = new Date(iso);
  let dia: string | null = null;
  if (grupo === "Esta semana") {
    dia = DIA_SEMANA_CURTO.format(data).replace(".", "").toLowerCase();
  } else if (grupo === "Antes") {
    dia = DIA_E_MES_CURTO.format(data).replace(".", "").replace(" de ", " ").toLowerCase();
  }
  return { hora: formatarHora(iso), dia };
}

export function useNotificacoes(): { naoLidas: number; ultimaNova: Notificacao | null; dispensar: () => void } {
  const [naoLidas, setNaoLidas] = useState(0);
  const [ultimaNova, setUltimaNova] = useState<Notificacao | null>(null);
  const ultimaConhecida = useRef<string | null>(null);
  const primeira = useRef(true);
  const propostasAvisadas = useRef(new Set<number>());

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;
    let ativa = true;

    const consultar = async () => {
      const id = meuId();
      if (id === null) {
        ultimaConhecida.current = null;
        primeira.current = true;
        propostasAvisadas.current.clear();
        setNaoLidas(0);
        setUltimaNova(null);
        return;
      }
      try {
        const resposta = await consultarNaoLidas();
        if (!ativa || meuId() !== id) return;
        setNaoLidas(resposta.total);
        if (primeira.current) {
          ultimaConhecida.current = resposta.ultima_em;
          primeira.current = false;
          return;
        }
        const base = ultimaConhecida.current;
        if (resposta.ultima_em && new Date(resposta.ultima_em) > new Date(base ?? 0)) {
          const pagina = await listarNotificacoes(0, 20);
          if (!ativa || meuId() !== id) return;
          const novas = pagina.items.filter((item) =>
            !item.lida && (base === null || new Date(item.em) > new Date(base)),
          );
          if (novas.length > 0) setUltimaNova(novas[0]);
          if (
            document.visibilityState !== "visible" &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            for (const notificacao of novas) {
              if (notificacao.tipo === "troca_proposta") {
                if (notificacao.troca_id === null || propostasAvisadas.current.has(notificacao.troca_id)) continue;
                new Notification("Nova proposta de troca", { body: notificacao.texto_curto });
                propostasAvisadas.current.add(notificacao.troca_id);
              }
            }
          }
        }
        ultimaConhecida.current = resposta.ultima_em;
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
