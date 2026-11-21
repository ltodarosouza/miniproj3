export function meuId(): number | null {
  if (typeof window === "undefined") return null;
  const valor = localStorage.getItem("usuario_id");
  return valor ? Number(valor) : null;
}
