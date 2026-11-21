"use client";

import type { HTMLAttributes, ReactNode } from "react";

import { useHolofote } from "@/lib/movimento";

export function Cartao({
  children,
  interativo = false,
  className = "",
  ...resto
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; interativo?: boolean }) {
  const ref = useHolofote<HTMLDivElement>();

  return (
    <div
      ref={interativo ? ref : undefined}
      className={`rounded-cartao border border-linha bg-superficie shadow-cartao ${
        interativo
          ? "holofote transition-[border-color,box-shadow,translate] duration-[var(--medio)] ease-saida hover:-translate-y-0.5 hover:border-linha-forte hover:shadow-alta"
          : ""
      } ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
