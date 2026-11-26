"use client";

import { useEffect, useState } from "react";

import type { MensagemLocal } from "@/components/mensagens/mensagemLocal";
import { formatarHora } from "@/lib/datas";
import { EstadoMensagem } from "@/components/mensagens/EstadoMensagem";

export function BalaoMensagem({
  mensagem,
  minha,
  mostrarHora,
  agrupadaComAnterior,
  recemChegada = false,
  aoTentarDeNovo,
}: {
  mensagem: MensagemLocal;
  minha: boolean;
  mostrarHora: boolean;
  agrupadaComAnterior: boolean;
  recemChegada?: boolean;
  aoTentarDeNovo?: (idLocal: number) => void;
}) {
  const [visivel, setVisivel] = useState(!recemChegada);

  useEffect(() => {
    if (!recemChegada) return;
    const quadro = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(quadro);
  }, [recemChegada]);

  return (
    <div className={`flex transition-[opacity,transform] duration-[var(--medio)] ease-saida motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${minha ? "justify-end" : "justify-start"} ${agrupadaComAnterior ? "mt-0.5" : "mt-3"}`}>
      <div className={`max-w-[75%] ${minha ? "items-end" : "items-start"} flex flex-col`}>
        <p className={`rounded-[4px] px-3 py-2 text-[0.9375rem] leading-relaxed whitespace-pre-wrap break-words text-texto ${minha ? "bg-marca-suave" : "bg-superficie-2"}`}>
          {mensagem.texto}
        </p>
        {(mostrarHora || mensagem.estado === "enviando" || mensagem.estado === "falhou") && <div className={`mt-1 flex items-center gap-1.5 px-0.5 font-mono text-[0.6875rem] tabular-nums ${mensagem.estado === "falhou" ? "text-perigo" : "text-texto-3"}`}>
          <time dateTime={mensagem.em}>{formatarHora(mensagem.em)}</time>
          {minha && mensagem.estado !== "falhou" && (mensagem.estado === "enviando" || mensagem.id > 0) && <span aria-hidden="true">·</span>}
          {minha && <EstadoMensagem mensagem={mensagem} />}
          {minha && mensagem.estado === "falhou" && <button type="button" className="font-sans underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo" onClick={() => mensagem.idLocal !== undefined && aoTentarDeNovo?.(mensagem.idLocal)}>Não enviada · Tentar de novo</button>}
        </div>}
      </div>
    </div>
  );
}
