import { apiDelete, apiGet, apiPatch, apiPost, apiPut, type Page, type User } from "@/lib/api";
import { type Post } from "@/lib/posts";

export type TipoHabilidade = "sei" | "quero_aprender";

export type HabilidadePerfil = {
  id: number;
  nome: string;
  categoria: string;
  tipo: TipoHabilidade;
  nivel: number;
};

export type ItemHabilidade = {
  habilidade_id: number;
  tipo: TipoHabilidade;
  nivel: number;
};

export const LIMITE_HABILIDADES = 40;

export type Perfil = User & {
  seguidores: number;
  seguindo: number;
  streak: number;
  media_avaliacoes: number | null;
  total_avaliacoes: number;
  habilidades: HabilidadePerfil[];
};

export type PerfilUpdate = {
  bio?: string;
  avatar_url?: string;
};

export function buscarPerfil(username: string): Promise<Perfil> {
  return apiGet<Perfil>(`/usuarios/${encodeURIComponent(username)}`);
}

export function atualizarPerfil(dados: PerfilUpdate): Promise<Perfil> {
  return apiPatch<Perfil>("/usuarios/eu", dados);
}

export async function enviarAvatar(arquivo: File): Promise<string> {
  const corpo = new FormData();
  corpo.append("arquivo", arquivo);
  const resposta = await apiPost<{ avatar_url: string }>("/usuarios/eu/avatar", corpo);
  return resposta.avatar_url;
}

export function removerAvatar(): Promise<void> {
  return apiDelete("/usuarios/eu/avatar");
}

export function listarPostsDoUsuario(
  username: string,
  offset = 0,
  limit = 20,
): Promise<Page<Post>> {
  return apiGet<Page<Post>>(
    `/usuarios/${encodeURIComponent(username)}/posts?offset=${offset}&limit=${limit}`,
  );
}

export function salvarHabilidades(itens: ItemHabilidade[]): Promise<HabilidadePerfil[]> {
  return apiPut<HabilidadePerfil[]>("/usuarios/eu/habilidades", itens);
}
