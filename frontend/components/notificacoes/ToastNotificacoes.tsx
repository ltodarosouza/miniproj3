"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { linkDaNotificacao, textoDoToast, useNotificacoes } from "@/lib/notificacoes";

export function ToastNotificacoes() {
  const { ultimaNova, dispensar } = useNotificacoes();
  const [visivel, setVisivel] = useState(false);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (!ultimaNova) {
      setVisivel(false);
      setPausado(false);
      return;
    }

    setVisivel(true);
    if (pausado) return;

    const temporizador = window.setTimeout(() => {
      setVisivel(false);
      dispensar();
    }, 6000);
    return () => window.clearTimeout(temporizador);
  }, [ultimaNova, dispensar, pausado]);

  function fechar() {
    setVisivel(false);
    dispensar();
  }

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-80">
      {ultimaNova && (
        <div
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={(e) => {
            if (!e.currentTarget.contains(document.activeElement)) setPausado(false);
          }}
          onFocus={() => setPausado(true)}
          onBlur={(e) => {
            if (
              !e.currentTarget.contains(e.relatedTarget as Node | null) &&
              !e.currentTarget.matches(":hover")
            ) {
              setPausado(false);
            }
          }}
          className={`flex items-start gap-3 rounded-cartao border border-linha bg-superficie p-3 shadow-[var(--sombra-alta)] transition-[opacity,translate] duration-200 motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 sm:-translate-y-2"}`}
        >
          <Avatar nome={ultimaNova.ator.name} url={ultimaNova.ator.avatar_url} tamanho="sm" />
          <Link
            href={linkDaNotificacao(ultimaNova)}
            onClick={fechar}
            className="min-w-0 flex-1 text-sm text-texto hover:underline"
          >
            {textoDoToast(ultimaNova)}
          </Link>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={fechar}
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-texto-3 transition-colors hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
