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
    <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-[calc(1rem+var(--altura-barra-inferior))] z-50 sm:inset-x-auto sm:right-4 sm:top-20 sm:bottom-auto sm:w-80">
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
          className={`flex items-start gap-3 rounded-[4px] bg-[var(--grafite,var(--texto))] p-3 text-[var(--grafite-texto,var(--fundo))] shadow-alta transition-[opacity,translate] duration-200 motion-reduce:transition-none ${visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0 sm:-translate-y-2"}`}
        >
          <Avatar nome={ultimaNova.ator.name} url={ultimaNova.ator.avatar_url} tamanho="sm" />
          <div className="min-w-0 flex-1">
            <span className="block font-mono text-[11px] uppercase tracking-[0.08em] opacity-70">Nova atividade</span>
            <Link
              href={linkDaNotificacao(ultimaNova)}
              onClick={fechar}
              className="text-sm hover:underline"
            >
              {textoDoToast(ultimaNova)}
            </Link>
          </div>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={fechar}
            className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-[4px] text-lg leading-none opacity-70 transition-colors hover:bg-current/10 hover:opacity-100 motion-reduce:transition-none"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
