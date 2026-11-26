import { NOME_REDE } from "@/lib/marca";

export const CELULA_A = "M11.57 19.30L18.50 23.30L18.50 31.30L11.57 35.30L4.64 31.30L4.64 23.30Z";
export const CELULA_B = "M28.43 19.30L35.36 23.30L35.36 31.30L28.43 35.30L21.50 31.30L21.50 23.30Z";
// Sete células pointy-top formam uma colmeia compacta centrada no quadro.
export const CELULAS_COLMEIA: string[] = [
  "M20.00 15.00L24.33 17.50L24.33 22.50L20.00 25.00L15.67 22.50L15.67 17.50Z",
  "M30.06 15.00L34.39 17.50L34.39 22.50L30.06 25.00L25.73 22.50L25.73 17.50Z",
  "M25.03 23.71L29.36 26.21L29.36 31.21L25.03 33.71L20.70 31.21L20.70 26.21Z",
  "M14.97 23.71L19.30 26.21L19.30 31.21L14.97 33.71L10.64 31.21L10.64 26.21Z",
  "M9.94 15.00L14.27 17.50L14.27 22.50L9.94 25.00L5.61 22.50L5.61 17.50Z",
  "M14.97 6.29L19.30 8.79L19.30 13.79L14.97 16.29L10.64 13.79L10.64 8.79Z",
  "M25.03 6.29L29.36 8.79L29.36 13.79L25.03 16.29L20.70 13.79L20.70 8.79Z",
];

type Variante = "simbolo" | "completo";
type Tamanho = "sm" | "md" | "lg";

const DIMENSOES: Record<Tamanho, number> = { sm: 20, md: 28, lg: 44 };
const TEXTOS: Record<Tamanho, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
};

function Simbolo({ tamanho, className, acessivel }: { tamanho: Tamanho; className?: string; acessivel: boolean }) {
  return (
    <svg
      width={DIMENSOES[tamanho]}
      height={DIMENSOES[tamanho]}
      viewBox="0 0 40 40"
      role={acessivel ? "img" : undefined}
      aria-label={acessivel ? NOME_REDE : undefined}
      aria-hidden={acessivel ? undefined : "true"}
      className={className}
    >
      {CELULAS_COLMEIA.map((d, indice) => (
        <path key={d} d={d} fill={indice === 0 ? "currentColor" : "var(--marca)"} />
      ))}
    </svg>
  );
}

export function Logo({
  variante = "completo",
  tamanho = "md",
  className = "",
}: {
  variante?: Variante;
  tamanho?: Tamanho;
  className?: string;
}) {
  if (variante === "simbolo") {
    return <Simbolo tamanho={tamanho} className={className} acessivel />;
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Simbolo tamanho={tamanho} acessivel={false} />
      <span className={`font-display font-bold tracking-[-0.02em] leading-none ${TEXTOS[tamanho]}`}>
        <span className="text-texto">Col</span>
        <span style={{ color: "var(--logo-match)" }}>match</span>
      </span>
    </span>
  );
}
