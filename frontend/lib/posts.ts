import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ErroApi,
  listarHabilidades,
  type HabilidadeResumo,
  type Page,
  type User,
} from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Motivo = "meu" | "seguindo" | "pode_te_ensinar" | "descobrir";

export type Post = {
  id: number;
  autor: User;
  texto: string;
  habilidade: HabilidadeResumo | null;
  minutos_estudados: number | null;
  imagem_url: string | null;
  created_at: string;
  editado_em: string | null;
  curtidas: number;
  curtido: boolean;
  comentarios: number;
};

export type ItemFeed = Post & { motivo: Motivo };

export type Comentario = {
  id: number;
  post_id: number;
  autor: User;
  texto: string;
  created_at: string;
};

export type NovoPost = {
  texto: string;
  habilidade_id: number | null;
  minutos_estudados: number | null;
};

export type HabilidadesAgrupadas = {
  tecnologia: HabilidadeResumo[];
  disciplinas: HabilidadeResumo[];
};

export const LIMITE_TEXTO_POST = 1000;
export const LIMITE_TEXTO_COMENTARIO = 500;
export const LIMITE_MINUTOS = 1440;
export const LIMITE_BYTES_IMAGEM = 2 * 1024 * 1024;
export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

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

export function criarPost(dados: NovoPost): Promise<Post> {
  return apiPost("/posts", dados);
}

export function buscarPost(id: number): Promise<Post> {
  return apiGet(`/posts/${id}`);
}

export type EdicaoPost = Partial<NovoPost>;

export function editarPost(id: number, dados: EdicaoPost): Promise<Post> {
  return apiPatch(`/posts/${id}`, dados);
}

export type HabilidadeEmAlta = {
  id: number;
  nome: string;
  categoria: string;
  posts: number;
  minutos: number;
};

export type MeuProgresso = {
  streak: number;
  minutos_semana: number;
  posts_semana: number;
};

export function listarEmAlta(limit = 5): Promise<HabilidadeEmAlta[]> {
  return apiGet(`/feed/em-alta?limit=${limit}`);
}

export function obterMeuProgresso(): Promise<MeuProgresso> {
  return apiGet("/feed/meu-progresso");
}

export function apagarPost(id: number): Promise<void> {
  return apiDelete(`/posts/${id}`);
}

export function validarImagem(arquivo: File): string | null {
  if (!TIPOS_IMAGEM.includes(arquivo.type)) return "Escolha uma foto jpg, png ou webp.";
  if (arquivo.size > LIMITE_BYTES_IMAGEM) return "A foto passa de 2 MB. Escolha uma menor.";
  return null;
}

export async function enviarImagem(id: number, arquivo: File): Promise<string> {
  const corpo = new FormData();
  corpo.append("arquivo", arquivo);
  try {
    const resposta = await apiPost<{ imagem_url: string }>(`/posts/${id}/imagem`, corpo);
    return resposta.imagem_url;
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 413) {
      throw new ErroApi("A foto passa de 2 MB. Escolha uma menor.", 413);
    }
    if (erro instanceof ErroApi && erro.status === 422) {
      throw new ErroApi("Escolha uma foto jpg, png ou webp.", 422);
    }
    throw erro;
  }
}

export function listarComentarios(id: number, offset = 0, limit = 100): Promise<Page<Comentario>> {
  return apiGet(`/posts/${id}/comentarios?offset=${offset}&limit=${limit}`);
}

export function comentar(id: number, texto: string): Promise<Comentario> {
  return apiPost(`/posts/${id}/comentarios`, { texto });
}

export async function habilidadesAgrupadas(): Promise<HabilidadesAgrupadas> {
  const { items } = await listarHabilidades();
  const ordenar = (lista: HabilidadeResumo[]) =>
    [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return {
    tecnologia: ordenar(items.filter((h) => h.categoria === "tech")),
    disciplinas: ordenar(items.filter((h) => h.categoria === "disciplina")),
  };
}
