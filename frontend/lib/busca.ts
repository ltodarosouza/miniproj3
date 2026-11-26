import { apiGet, type HabilidadeResumo, type User } from "@/lib/api";
import type { Post } from "@/lib/posts";

export type TipoBusca = "pessoas" | "posts" | "habilidades";

export type HabilidadeEncontrada = HabilidadeResumo & { sabem: number; querem: number };

export type ResultadoBusca = {
  tipo: TipoBusca;
  pessoas: User[];
  posts: Post[];
  habilidades: HabilidadeEncontrada[];
  total: number;
  offset: number;
  limit: number;
};

export type DetalheHabilidade = {
  habilidade: HabilidadeResumo;
  sabem: User[];
  querem: User[];
  posts: Post[];
};

export function buscar(q: string, tipo: TipoBusca, offset = 0, limit = 20): Promise<ResultadoBusca> {
  const params = new URLSearchParams({ q, tipo, offset: String(offset), limit: String(limit) });
  return apiGet(`/busca?${params}`);
}

export function detalharHabilidade(id: number): Promise<DetalheHabilidade> {
  return apiGet(`/busca/habilidades/${id}`);
}

// Compara textos sem diferenciar acento nem maiúscula: "calculo" acha "Cálculo 1".
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
