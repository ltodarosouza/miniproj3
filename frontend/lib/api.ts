// Fetch tipado, único ponto de contato com o backend.
// Já preparado para receber o token da auth (guia 01, Parte 2).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // Parte 2 do guia 01: leia o token salvo no login e envie em Authorization.
  if (typeof window !== "undefined") {
    const usuarioId = localStorage.getItem("usuario_id");
    if (usuarioId) h["X-User-Id"] = usuarioId;
  }
  return h;
}

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  // 401 com token salvo = token que não vale mais (ex.: o banco foi apagado ou o
  // servidor do deploy reiniciou). Joga o token fora e volta para o login.
  if (res.status === 401 && typeof window !== "undefined" && localStorage.getItem("token")) {
    localStorage.removeItem("token");
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }

  if (!res.ok) {
    // 422 = corpo inválido; 409 = conflito (ex.: username repetido). Ver guia 04.
    const erro = await res.json().catch(() => null);
    const detail = typeof erro?.detail === "string" ? erro.detail : null;
    throw new ErroApi(detail ?? `${method} ${path} → ${res.status}`, res.status);
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


export type Mensagem = {
  id: number;
  de_username: string;
  para_username: string;
  texto: string;
  em: string;
};

export type Conversa = {
  com: User;
  ultima_mensagem: string;
  ultima_de_mim: boolean;
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

export type NovaTroca = {
  com_username: string;
  data_hora: string;
  link_meet: string;
  habilidade_ensino_id: number | null;
  habilidade_aprendo_id: number | null;
};

export type Avaliacao = {
  id: number;
  troca_id: number;
  de: User;
  para: User;
  estrelas: number;
  feedback: string;
  em: string;
};

export type ResumoAvaliacoes = {
  media: number | null;
  total: number;
  items: Avaliacao[];
};

export function listarConversas(): Promise<{ items: Conversa[] }> {
  return apiGet("/dms");
}

export function listarMensagens(username: string, depoisDe?: number): Promise<{ items: Mensagem[] }> {
  const filtro = depoisDe === undefined ? "" : `?depois_de=${depoisDe}`;
  return apiGet(`/dms/${encodeURIComponent(username)}${filtro}`);
}

export function enviarMensagem(username: string, texto: string): Promise<Mensagem> {
  return apiPost(`/dms/${encodeURIComponent(username)}`, { texto });
}

export function listarHabilidades(): Promise<{ items: HabilidadeResumo[] }> {
  return apiGet("/habilidades");
}

export function listarTrocas(comUsername?: string): Promise<{ items: Troca[] }> {
  const filtro = comUsername ? `?com=${encodeURIComponent(comUsername)}` : "";
  return apiGet(`/trocas${filtro}`);
}

export function proporTroca(dados: NovaTroca): Promise<Troca> {
  return apiPost("/trocas", dados);
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

export function avaliacoesDe(username: string): Promise<ResumoAvaliacoes> {
  return apiGet(`/usuarios/${encodeURIComponent(username)}/avaliacoes`);
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
