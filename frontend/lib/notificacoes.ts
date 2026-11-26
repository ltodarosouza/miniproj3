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

type PaginaAnterior = { items: Notificacao[]; fim: boolean };

const MICROS_POR_SEGUNDO = BigInt(1000000);
const LIMITE_API = 100;

function microssegundos(iso: string): bigint {
  const partes = iso.match(/^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$/);
  if (!partes) return BigInt(Date.parse(iso)) * BigInt(1000);
  const base = partes[1] + (partes[3] ?? "Z");
  const fracao = (partes[2] ?? "").padEnd(6, "0").slice(0, 6);
  return BigInt(Date.parse(base)) * BigInt(1000) + BigInt(fracao);
}

function isoDeMicrossegundos(us: bigint): string {
  const fracao = ((us % MICROS_POR_SEGUNDO) + MICROS_POR_SEGUNDO) % MICROS_POR_SEGUNDO;
  const segundos = (us - fracao) / MICROS_POR_SEGUNDO;
  return new Date(Number(segundos) * 1000).toISOString().replace(
    /\.\d{3}Z$/,
    `.${fracao.toString().padStart(6, "0")}Z`,
  );
}

async function recuarPorPosicao(
  limite: bigint,
  limit: number,
  vistas: Set<string>,
): Promise<PaginaAnterior> {
  const encontrados: Notificacao[] = [];
  let offset = 0;
  // Sem snapshot na API, alterações entre páginas ainda podem deslocar offsets.
  while (true) {
    const pagina = await listarNotificacoes(offset, LIMITE_API);
    for (const item of pagina.items) {
      if (microssegundos(item.em) > limite) continue;
      const chave = chaveDaNotificacao(item);
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      encontrados.push(item);
      if (encontrados.length > limit) return { items: encontrados, fim: false };
    }
    offset += pagina.items.length;
    if (pagina.items.length < LIMITE_API || offset >= pagina.total) {
      return { items: encontrados, fim: true };
    }
  }
}

export async function listarNotificacoesAntesDe(
  ultimoEm: string,
  limit = 50,
  chavesVistas: Iterable<string> = [],
): Promise<PaginaAnterior> {
  const limite = microssegundos(ultimoEm);
  const cursor = isoDeMicrossegundos(limite + BigInt(1));
  const vistas = new Set(chavesVistas);
  // Reserva espaço para o item do cursor e para um item além da página exibida.
  const limiteBusca = Math.min(limit + 2, LIMITE_API);
  const resposta = await apiGet<Page<Notificacao>>(
    `/notificacoes?antes_de=${encodeURIComponent(cursor)}&limit=${limiteBusca}`,
  );
  if (resposta.items.some((item) => microssegundos(item.em) > limite)) {
    return recuarPorPosicao(limite, limit, vistas);
  }
  const chaves = new Set(vistas);
  const ineditas = resposta.items.filter((item) => {
    const chave = chaveDaNotificacao(item);
    if (chaves.has(chave)) return false;
    chaves.add(chave);
    return true;
  });
  if (ineditas.length > limit) return { items: ineditas.slice(0, limit + 1), fim: false };
  if (resposta.items.length < limiteBusca) return { items: ineditas, fim: true };
  return recuarPorPosicao(limite, limit, vistas);
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
