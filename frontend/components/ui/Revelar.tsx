"use client";

import type { ReactNode } from "react";

import { useVisivel } from "@/lib/movimento";

export function Revelar({
  children,
  atraso = 0,
  antecipacao,
  className = "",
}: {
  children: ReactNode;
  atraso?: number;
  antecipacao?: string;
  className?: string;
}) {
  const [ref, visivel] = useVisivel<HTMLDivElement>({ antecipacao });

  return (
    <div
      ref={ref}
      data-visivel={visivel ? "sim" : "nao"}
      className={`revelar ${className}`}
      style={{ "--atraso": `${atraso}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
