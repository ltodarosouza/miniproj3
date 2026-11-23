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
