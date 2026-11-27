// Fetch tipado, único ponto de contato com o backend.
// Já preparado para receber o token da auth (guia 01, Parte 2).

import { limparSessao } from "@/lib/sessao";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function headers(json = true): HeadersInit {
  const h: Record<string, string> = json ? { "Content-Type": "application/json" } : {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    } else {
      const usuarioId = localStorage.getItem("usuario_id");
      if (usuarioId) h["X-User-Id"] = usuarioId;
    }
  }
  return h;
}

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
    public campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

function camposDoErro(detail: unknown): Record<string, string> {
  const campos: Record<string, string> = {};
  if (!Array.isArray(detail)) return campos;

  for (const item of detail) {
    if (!item || typeof item !== "object") continue;
    const { loc, msg } = item as { loc?: unknown; msg?: unknown };
    if (!Array.isArray(loc) || typeof msg !== "string") continue;
    const campo = loc[loc.length - 1];
    if (typeof campo === "string") campos[campo] = msg;
  }
  return campos;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const arquivo = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: headers(!arquivo),
    body: body === undefined ? undefined : arquivo ? body : JSON.stringify(body),
    cache: "no-store",
  });

  // 401 com token salvo = token que não vale mais. Joga o token fora; os pedidos
  // da conversa mostram "Sessão encerrada" na própria tela.
  if (res.status === 401 && typeof window !== "undefined" && localStorage.getItem("token")) {
    limparSessao();
    const pathname = window.location.pathname;
    const conversaAberta = /^\/mensagens\/[^/]+\/?$/.test(pathname);
    if (pathname !== "/login" && !conversaAberta) {
      window.location.href = "/login";
    }
  }

  if (!res.ok) {
    // 422 = corpo inválido; 409 = conflito (ex.: username repetido). Ver guia 04.
    const erro = await res.json().catch(() => null);
    const detail = erro?.detail;
    const campos = camposDoErro(detail);
    const primeira = Object.values(campos)[0];
    const mensagem =
      typeof detail === "string"
        ? detail
        : primeira ?? `${method} ${path} → ${res.status}`;
    throw new ErroApi(mensagem, res.status, campos);
  }

  // 204 No Content (seguir, curtir, apagar...) não tem corpo: não há JSON para ler.
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PATCH", path, body);
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

// ---- tipos do slice de exemplo (espelham backend/app/schemas/user.py) ----

export type User = {
  id: number;
  username: string;
  name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};

type Credenciais = {
  username: string;
  password: string;
};

type DadosRegistro = Credenciais & {
  name: string;
};

export function buscarUsuarios(busca: string, offset = 0, limit = 20): Promise<Page<User>> {
  const filtro = busca.trim() ? `&q=${encodeURIComponent(busca.trim())}` : "";
  return apiGet<Page<User>>(`/usuarios?offset=${offset}&limit=${limit}${filtro}`);
}

export function registrar(dados: DadosRegistro): Promise<User> {
  return apiPost<User>("/auth/registro", dados);
}

export function login(dados: Credenciais): Promise<{ token: string }> {
  return apiPost<{ token: string }>("/auth/login", dados);
}

export function eu(): Promise<User> {
  return apiGet<User>("/auth/eu");
}

export function logout(): Promise<void> {
  return apiPost<void>("/auth/logout");
}


export type Mensagem = {
  id: number;
  de_username: string;
  para_username: string;
  texto: string;
  em: string;
};

export type HabilidadeResumo = {
  id: number;
  nome: string;
  categoria: "tech" | "disciplina";
};

export type StatusTroca = "proposta" | "confirmada" | "recusada";

export type Troca = {
  id: number;
  proposta_por: User;
  com: User;
  data_hora: string;
  link_meet: string;
  habilidade_ensino: HabilidadeResumo | null;
  habilidade_aprendo: HabilidadeResumo | null;
  status: StatusTroca;
  criada_em: string;
  respondida_em: string | null;
  link_google_agenda: string;
};

type Avaliacao = {
  id: number;
  troca_id: number;
  de: User;
  para: User;
  estrelas: number;
  feedback: string;
  em: string;
};

export function listarMensagens(username: string, depoisDe?: number): Promise<{ items: Mensagem[] }> {
  const filtro = depoisDe === undefined ? "" : `?depois_de=${depoisDe}`;
  return apiGet(`/dms/${encodeURIComponent(username)}${filtro}`);
}

export function listarHabilidades(): Promise<{ items: HabilidadeResumo[] }> {
  return apiGet("/habilidades");
}

export function buscarAutocomplete(prefixo: string): Promise<{ items: HabilidadeResumo[] }> {
  return apiGet(`/habilidades/autocomplete?prefixo=${encodeURIComponent(prefixo)}`);
}

export function mapearHabilidade(texto: string): Promise<{ habilidade: HabilidadeResumo | null }> {
  return apiPost("/habilidades/mapear", { texto });
}

export function listarTrocas(comUsername?: string): Promise<{ items: Troca[] }> {
  const filtro = comUsername ? `?com=${encodeURIComponent(comUsername)}` : "";
  return apiGet(`/trocas${filtro}`);
}

export function confirmarTroca(id: number): Promise<Troca> {
  return apiPost(`/trocas/${id}/confirmar`);
}

export function recusarTroca(id: number): Promise<Troca> {
  return apiPost(`/trocas/${id}/recusar`);
}

export function trocasPendentesAvaliacao(): Promise<{ items: Troca[] }> {
  return apiGet("/trocas/pendentes-avaliacao");
}

export function avaliarTroca(id: number, estrelas: number, feedback: string): Promise<Avaliacao> {
  return apiPost(`/trocas/${id}/avaliar`, { estrelas, feedback });
}

// ---- follow (frente C) ----

export type EstadoFollow = {
  seguindo: boolean;
  seguidores: number;
};

export type Conexao = User & {
  eu_sigo: boolean | null;
};

export function estadoFollow(username: string): Promise<EstadoFollow> {
  return apiGet<EstadoFollow>(`/usuarios/${encodeURIComponent(username)}/follow`);
}

export function seguir(username: string): Promise<EstadoFollow> {
  return apiPost<EstadoFollow>(`/usuarios/${encodeURIComponent(username)}/follow`);
}

export function deixarDeSeguir(username: string): Promise<EstadoFollow> {
  return apiDelete<EstadoFollow>(`/usuarios/${encodeURIComponent(username)}/follow`);
}

export function listarConexoes(
  username: string,
  tipo: "seguidores" | "seguindo",
  offset = 0,
  limit = 20,
): Promise<Page<Conexao>> {
  return apiGet<Page<Conexao>>(
    `/usuarios/${encodeURIComponent(username)}/${tipo}?offset=${offset}&limit=${limit}`,
  );
}

export type HabilidadeComNivel = {
  id: number;
  nome: string;
  nivel: number;
};

export type Match = {
  usuario: User;
  me_ensina: HabilidadeComNivel[];
  eu_ensino: HabilidadeComNivel[];
};

export type Matches = {
  troca: Match[];
  pode_te_ensinar: Match[];
};

export function listarMatches(): Promise<Matches> {
  return apiGet<Matches>("/matches");
}
