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
    <div className={`flex transition-[opacity,transform] duration-[var(--medio)] ease-saida motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"} ${minha ? "justify-end" : "justify-start"} ${agrupadaComAnterior ? "mt-1" : "mt-3"}`}>
      <div className={`max-w-[75%] ${minha ? "items-end" : "items-start"} flex flex-col`}>
        <p className={`whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[0.9375rem] leading-relaxed ${minha ? "rounded-br-md bg-marca-suave text-texto" : "rounded-bl-md bg-superficie-2 text-texto"}`}>
          {mensagem.texto}
        </p>
        {(mostrarHora || mensagem.estado === "enviando" || mensagem.estado === "falhou") && <div className={`mt-1 flex items-center gap-1 px-1 text-[0.6875rem] ${mensagem.estado === "falhou" ? "text-perigo" : "text-texto-3"}`}>
          {minha && (mostrarHora || mensagem.estado === "enviando" || mensagem.estado === "falhou") && <EstadoMensagem mensagem={mensagem} />}
          <time className="numeros">{formatarHora(mensagem.em)}</time>
          {minha && mensagem.estado === "falhou" && <button type="button" className="underline underline-offset-2 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-perigo" onClick={() => mensagem.idLocal !== undefined && aoTentarDeNovo?.(mensagem.idLocal)}>Não enviada · Tentar de novo</button>}
        </div>}
      </div>
    </div>
  );
}
