"use client";

import { useEffect, useState } from "react";

import type { Mensagem } from "@/lib/api";
import { formatarHora } from "@/lib/datas";

export function BalaoMensagem({
  mensagem,
  minha,
  mostrarHora,
  agrupadaComAnterior,
  recemChegada = false,
}: {
  mensagem: Mensagem;
  minha: boolean;
  mostrarHora: boolean;
  agrupadaComAnterior: boolean;
  recemChegada?: boolean;
}) {
  const [visivel, setVisivel] = useState(!recemChegada);

  useEffect(() => {
    if (!recemChegada) return;
    const quadro = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(quadro);
  }, [recemChegada]);

  return (
    <div className={`flex transition-[opacity,transform] duration-[var(--medio)] ease-saida motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${minha ? "justify-end" : "justify-start"} ${agrupadaComAnterior ? "mt-1" : "mt-3"}`}>
      <div className={`max-w-[75%] ${minha ? "items-end" : "items-start"} flex flex-col`}>
        <p className={`whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[0.9375rem] leading-relaxed ${minha ? "rounded-br-md bg-marca-suave text-texto" : "rounded-bl-md bg-superficie-2 text-texto"}`}>
          {mensagem.texto}
        </p>
        {mostrarHora && <time className="numeros mt-1 px-1 text-[0.6875rem] text-texto-3">{formatarHora(mensagem.em)}</time>}
      </div>
    </div>
  );
}
