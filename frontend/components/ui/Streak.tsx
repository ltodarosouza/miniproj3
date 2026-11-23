"use client";

import Link from "next/link";

import { HREF_PUBLICAR } from "./casca";
import { Icone } from "./Icone";

export function Streak({
  dias,
  postouHoje,
  alinharDica = "centro",
  className,
}: {
  dias: number;
  postouHoje: boolean;
  alinharDica?: "centro" | "inicio" | "fim";
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
      className={`group relative inline-flex h-9 items-center gap-1 rounded-controle px-2 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 ${postouHoje ? "text-texto" : "text-texto-3"} ${className ?? ""}`}
    >
      <Icone nome="chama" tamanho={18} preenchido={postouHoje} className={postouHoje ? "text-troca" : undefined} />
      <span className="text-sm font-semibold numeros">{dias}</span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${posicaoDica} top-full z-50 mt-2 whitespace-nowrap rounded-controle bg-texto px-2.5 py-1.5 text-xs font-medium text-fundo opacity-0 shadow-alta transition-opacity duration-[var(--rapido)] group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:hidden`}
      >
        {dica}
      </span>
    </Link>
  );
}
