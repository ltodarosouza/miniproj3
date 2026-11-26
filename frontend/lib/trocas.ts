import { apiGet, apiPost, type HabilidadeComNivel, type Match, type Matches, type Troca } from "@/lib/api";

export type OpcoesTroca = {
  eu_ensino: HabilidadeComNivel[];
  eu_aprendo: HabilidadeComNivel[];
};

export type MatchesComAndamento = Matches & {
  em_andamento: Match[];
};

export type PropostaDeTroca = {
  com_username: string;
  data_hora: string;
  habilidade_ensino_id: number | null;
  habilidade_aprendo_id: number | null;
};

export function obterOpcoesTroca(username: string): Promise<OpcoesTroca> {
  return apiGet(`/trocas/opcoes/${encodeURIComponent(username)}`);
}

export function enviarPropostaDeTroca(dados: PropostaDeTroca): Promise<Troca> {
  return apiPost("/trocas", dados);
}

export function listarMatchesComAndamento(): Promise<MatchesComAndamento> {
  return apiGet<MatchesComAndamento>("/matches").then((dados) => ({
    ...dados,
    em_andamento: dados.em_andamento ?? [],
  }));
}

export type StatusDaOrdem = "aberta" | "confirmada" | "concluida" | "recusada";

export const ROTULO_STATUS: Record<StatusDaOrdem, string> = {
  aberta: "aberta",
  confirmada: "confirmada",
  concluida: "concluída",
  recusada: "recusada",
};

export function statusDaOrdem(troca: Troca, agora = Date.now()): StatusDaOrdem {
  if (troca.status === "proposta") return "aberta";
  if (troca.status === "recusada") return "recusada";
  if (new Date(troca.data_hora).getTime() <= agora) return "concluida";
  return "confirmada";
}

export function numeroDaOrdem(id: number): string {
  return `#TR-${String(id).padStart(4, "0")}`;
}

const formatarDiaDaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const formatarDia = new Intl.DateTimeFormat("pt-BR", { day: "numeric" });
const formatarMes = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const formatarHora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function dataDaOrdem(iso: string, agora = Date.now()): string {
  const data = new Date(iso);
  const minutos = Math.floor(Math.abs(data.getTime() - agora) / 60_000);
  let relativo: string;

  if (minutos < 1) {
    relativo = "agora";
  } else {
    const futuro = data.getTime() > agora;
    const prefixo = futuro ? "em " : "há ";

    if (minutos < 60) {
      relativo = `${prefixo}${minutos} min`;
    } else if (minutos < 24 * 60) {
      relativo = `${prefixo}${Math.floor(minutos / 60)} h`;
    } else {
      const dias = Math.floor(minutos / (24 * 60));
      relativo = `${prefixo}${dias} dia${dias === 1 ? "" : "s"}`;
    }
  }

  const diaFormatado = [
    formatarDiaDaSemana.format(data),
    formatarDia.format(data),
    formatarMes.format(data),
  ].map((parte) => parte.replace(/\./g, "").toLocaleLowerCase("pt-BR")).join(" ");

  return `${diaFormatado} · ${formatarHora.format(data)} · ${relativo}`;
}
