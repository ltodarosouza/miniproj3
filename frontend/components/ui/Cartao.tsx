import type { HTMLAttributes, ReactNode } from "react";

export function Cartao({
  children,
  interativo = false,
  className = "",
  ...resto
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; interativo?: boolean }) {
  return (
    <div
      className={`rounded-cartao border border-linha bg-superficie shadow-cartao ${
        interativo
          ? "transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida hover:border-linha-forte hover:shadow-alta"
          : ""
      } ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
