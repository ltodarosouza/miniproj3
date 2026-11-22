import { apiGet, apiPatch, type Page, type User } from "@/lib/api";
import { type Post } from "@/lib/posts";

export type HabilidadePerfil = {
  id: number;
  nome: string;
  categoria: string;
  tipo: string;
  nivel: number;
};

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

export function listarPostsDoUsuario(
  username: string,
  offset = 0,
  limit = 20,
): Promise<Page<Post>> {
  return apiGet<Page<Post>>(
    `/usuarios/${encodeURIComponent(username)}/posts?offset=${offset}&limit=${limit}`,
  );
}
