"use client";

import { useEffect, useRef, useState } from "react";
import { prefereMenosMovimento } from "@/lib/movimento";

export function PuxarParaAtualizar({
  aoAtualizar,
  children,
}: {
  aoAtualizar: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const indicadorRef = useRef<HTMLDivElement>(null);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const inicioRef = useRef<number | null>(null);
  const distanciaRef = useRef(0);
  const atualizandoRef = useRef(false);
  const atualizarRef = useRef(aoAtualizar);
  const [atualizando, setAtualizando] = useState(false);

  atualizarRef.current = aoAtualizar;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const indicador = indicadorRef.current;
    const conteudo = conteudoRef.current;
    if (!wrapper || !indicador || !conteudo) return;

    function definirDistancia(distancia: number, transicao: boolean) {
      const semMovimento = prefereMenosMovimento();
      const transicaoCss = transicao && !semMovimento
        ? "transform var(--medio) var(--ease-saida), opacity var(--medio) var(--ease-saida)"
        : "none";
      indicador!.style.transition = transicaoCss;
      conteudo!.style.transition = transicaoCss;
      indicador!.style.transform = `translateY(${distancia > 0 ? distancia - 40 : 0}px) rotate(${distancia * 3}deg)`;
      indicador!.style.opacity = `${Math.min(1, distancia / 70)}`;
      conteudo!.style.transform = `translateY(${distancia * 0.6}px)`;
    }

    function aoIniciar(evento: TouchEvent) {
      if (atualizandoRef.current || window.scrollY > 0 || evento.touches.length !== 1) return;
      inicioRef.current = evento.touches[0].clientY;
      distanciaRef.current = 0;
      definirDistancia(0, false);
    }

    function aoMover(evento: TouchEvent) {
      if (inicioRef.current === null || atualizandoRef.current || evento.touches.length !== 1) return;
      const delta = evento.touches[0].clientY - inicioRef.current;
      if (delta <= 0) {
        inicioRef.current = null;
        distanciaRef.current = 0;
        definirDistancia(0, false);
        return;
      }
      const distancia = Math.min(110, delta * 0.5);
      distanciaRef.current = distancia;
      if (distancia > 0) evento.preventDefault();
      definirDistancia(distancia, false);
    }

    async function aoFinalizar() {
      if (inicioRef.current === null || atualizandoRef.current) return;
      inicioRef.current = null;
      if (distanciaRef.current >= 70) {
        atualizandoRef.current = true;
        setAtualizando(true);
        const semMovimento = prefereMenosMovimento();
        indicador!.style.transition = semMovimento ? "none" : "transform var(--medio) var(--ease-saida), opacity var(--medio) var(--ease-saida)";
        conteudo!.style.transition = indicador!.style.transition;
        indicador!.style.transform = "translateY(16px) rotate(0deg)";
        indicador!.style.opacity = "1";
        conteudo!.style.transform = "translateY(40px)";
        try {
          await atualizarRef.current();
        } catch {}
        atualizandoRef.current = false;
        setAtualizando(false);
      }
      distanciaRef.current = 0;
      definirDistancia(0, true);
    }

    function aoCancelar() {
      if (inicioRef.current === null || atualizandoRef.current) return;
      inicioRef.current = null;
      distanciaRef.current = 0;
      definirDistancia(0, true);
    }

    wrapper.addEventListener("touchstart", aoIniciar, { passive: true });
    wrapper.addEventListener("touchmove", aoMover, { passive: false });
    wrapper.addEventListener("touchend", aoFinalizar);
    wrapper.addEventListener("touchcancel", aoCancelar);
    return () => {
      wrapper.removeEventListener("touchstart", aoIniciar);
      wrapper.removeEventListener("touchmove", aoMover);
      wrapper.removeEventListener("touchend", aoFinalizar);
      wrapper.removeEventListener("touchcancel", aoCancelar);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div
        ref={indicadorRef}
        role="status"
        className="absolute left-1/2 top-0 z-10 -ml-[18px] flex size-9 items-center justify-center rounded-full border border-linha bg-superficie text-marca shadow-cartao"
        style={{ opacity: 0 }}
      >
        <span className={`size-4 rounded-full border-2 border-current border-r-transparent${atualizando ? " animate-spin" : ""}`} />
        {atualizando && <span className="sr-only">Atualizando…</span>}
      </div>
      <div ref={conteudoRef}>{children}</div>
    </div>
  );
}
