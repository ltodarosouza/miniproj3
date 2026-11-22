import { apiDelete, apiGet, apiPost, type HabilidadeResumo, type Page, type User } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Motivo = "seguindo" | "pode_te_ensinar";

export type Post = {
  id: number;
  autor: User;
  texto: string;
  habilidade: HabilidadeResumo | null;
  minutos_estudados: number | null;
  imagem_url: string | null;
  created_at: string;
  curtidas: number;
  curtido: boolean;
  comentarios: number;
};

export type ItemFeed = Post & { motivo: Motivo };

export function listarFeed(offset: number, limit: number): Promise<Page<ItemFeed>> {
  return apiGet(`/feed?offset=${offset}&limit=${limit}`);
}

export function curtirPost(id: number): Promise<void> {
  return apiPost(`/posts/${id}/curtir`);
}

export function descurtirPost(id: number): Promise<void> {
  return apiDelete(`/posts/${id}/curtir`);
}

export function urlDaImagem(caminho: string): string {
  return caminho.startsWith("http") ? caminho : `${BASE}${caminho}`;
}

export function formatarTempoEstudado(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}`;
}
