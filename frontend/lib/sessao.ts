export function salvarToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function salvarUsuarioId(id: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("usuario_id", String(id));
}

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("usuario_id");
}

export function temToken(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("token") !== null;
}

export function meuId(): number | null {
  if (typeof window === "undefined") return null;
  const valor = localStorage.getItem("usuario_id");
  return valor ? Number(valor) : null;
}
