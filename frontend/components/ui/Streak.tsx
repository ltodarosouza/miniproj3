"use client";

import Link from "next/link";

import { HREF_PUBLICAR } from "./casca";

const DIA_SEMANA = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short" });
const INDICE_DIA: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

function segmentosDaSemana(dias: number, postouHoje: boolean): boolean[] {
  const hoje = INDICE_DIA[DIA_SEMANA.format(new Date())] ?? 0;
  const fim = postouHoje ? hoje : hoje - 1;
  return Array.from({ length: 7 }, (_, i) => i <= fim && i > fim - dias);
}

export function Streak({
  dias,
  postouHoje,
  alinharDica = "centro",
  compacto = false,
  className,
}: {
  dias: number;
  postouHoje: boolean;
  alinharDica?: "centro" | "inicio" | "fim";
  compacto?: boolean;
  className?: string;
}) {
  const duracao = `${dias} ${dias === 1 ? "dia" : "dias"}`;
  const dica = postouHoje
    ? `Sequência de ${duracao}`
    : dias > 0
      ? `Poste hoje para manter sua sequência de ${duracao}`
      : "Poste hoje para começar uma sequência";

  const posicaoDica = {
    centro: "left-1/2 -translate-x-1/2",
    inicio: "left-0",
    fim: "right-0",
  }[alinharDica];

  return (
    <Link
      href={postouHoje ? "/perfil/eu" : HREF_PUBLICAR}
      aria-label={dica}
      className={`group relative inline-flex items-center gap-1.5 rounded-controle px-2 ${compacto ? "flex-col py-1.5 xl:h-9 xl:flex-row xl:py-0" : "h-9"} transition-colors duration-[var(--rapido)] hover:bg-superficie-2 ${postouHoje ? "text-texto" : "text-texto-2"} ${className ?? ""}`}
    >
      <span aria-hidden="true" className="flex items-center gap-[2px]">
        {segmentosDaSemana(dias, postouHoje).map((cheio, i) => (
          <span key={i} className={`h-2.5 w-[5px] rounded-[1px] ${cheio ? "bg-marca" : "bg-texto-3/40"}`} />
        ))}
      </span>
      <span className="font-mono text-xs font-medium numeros">{dias}d</span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${posicaoDica} top-full z-50 mt-2 whitespace-nowrap rounded-controle bg-texto px-2.5 py-1.5 text-xs font-medium text-fundo opacity-0 shadow-alta transition-opacity duration-[var(--rapido)] group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:hidden`}
      >
        {dica}
      </span>
    </Link>
  );
}
