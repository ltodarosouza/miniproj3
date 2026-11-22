export type Tema = "claro" | "escuro";

const CHAVE = "tema";

export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE}");if(t==="claro")document.documentElement.dataset.theme="light";if(t==="escuro")document.documentElement.dataset.theme="dark";}catch(e){}})();`;

export function temaAtual(): Tema {
  if (typeof window === "undefined") return "claro";
  const forcado = document.documentElement.dataset.theme;
  if (forcado === "light") return "claro";
  if (forcado === "dark") return "escuro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export function aplicarTema(tema: Tema): void {
  document.documentElement.dataset.theme = tema === "escuro" ? "dark" : "light";
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {}
}
