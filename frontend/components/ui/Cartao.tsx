import type { HTMLAttributes, ReactNode } from "react";

export function Cartao({
  children,
  interativo = false,
  rotulo,
  className = "",
  ...resto
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interativo?: boolean;
  rotulo?: string;
}) {
  return (
    <div
      className={`rounded-cartao border border-linha bg-superficie ${
        interativo
          ? "transition-colors duration-[var(--rapido)] ease-saida hover:border-linha-forte"
          : ""
      } ${className}`}
      {...resto}
    >
      {rotulo && (
        <header className="mb-3 border-b border-linha pb-2 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-texto-2">
          {rotulo}
        </header>
      )}
      {children}
    </div>
  );
}
