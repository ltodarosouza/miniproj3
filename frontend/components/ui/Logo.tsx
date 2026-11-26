import { NOME_REDE } from "@/lib/marca";

export const CELULA_A = "M11.57 19.30L18.50 23.30L18.50 31.30L11.57 35.30L4.64 31.30L4.64 23.30Z";
export const CELULA_B = "M28.43 19.30L35.36 23.30L35.36 31.30L28.43 35.30L21.50 31.30L21.50 23.30Z";
export const CELULA_C = "M20.00 5.45L26.28 9.08L26.28 16.33L20.00 19.95L13.72 16.33L13.72 9.08Z";

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
      <path d={CELULA_A} fill="var(--marca)" />
      <path d={CELULA_B} fill="var(--marca)" />
      <rect x="18" y="25.8" width="4" height="3" fill="var(--marca)" />
      <path d={CELULA_C} fill="none" stroke="currentColor" strokeWidth={1.5} />
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
        <span className="text-marca-forte">match</span>
      </span>
    </span>
  );
}
