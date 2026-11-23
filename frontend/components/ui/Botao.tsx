"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { useMagnetico } from "@/lib/movimento";

type Variante = "primario" | "secundario" | "fantasma" | "troca";
type Tamanho = "sm" | "md";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-marca text-marca-texto shadow-cartao hover:bg-marca-forte",
  secundario:
    "bg-superficie text-texto border border-linha-forte hover:border-marca hover:text-marca-forte",
  fantasma: "text-texto-2 hover:text-texto hover:bg-superficie-2",
  troca:
    "bg-troca text-[oklch(0.22_0.04_50)] shadow-cartao hover:brightness-105",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 relative after:absolute after:-inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[''] sm:after:hidden",
  md: "h-10 px-4 text-[0.9375rem] gap-2",
};

function classesBotao(
  variante: Variante,
  tamanho: Tamanho,
  className: string,
): string {
  return `inline-flex select-none items-center justify-center rounded-controle font-medium transition-[background-color,border-color,color,box-shadow,filter,scale] duration-[var(--rapido)] ease-saida active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIANTES[variante]} ${TAMANHOS[tamanho]} ${className}`;
}

export function Botao({
  variante = "primario",
  tamanho = "md",
  carregando = false,
  magnetico = false,
  children,
  className = "",
  disabled,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamanho?: Tamanho;
  carregando?: boolean;
  magnetico?: boolean;
  children: ReactNode;
}) {
  const ref = useMagnetico<HTMLButtonElement>(magnetico ? 0.22 : 0);

  return (
    <button
      ref={magnetico ? ref : undefined}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={classesBotao(variante, tamanho, className)}
      {...resto}
    >
      {carregando && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {children}
    </button>
  );
}

export function BotaoLink({
  href,
  variante = "primario",
  tamanho = "md",
  magnetico = false,
  children,
  className = "",
  ...resto
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variante?: Variante;
  tamanho?: Tamanho;
  magnetico?: boolean;
  children: ReactNode;
}) {
  const ref = useMagnetico<HTMLAnchorElement>(magnetico ? 0.22 : 0);

  return (
    <Link
      href={href}
      ref={magnetico ? ref : undefined}
      className={classesBotao(variante, tamanho, className)}
      {...resto}
    >
      {children}
    </Link>
  );
}
