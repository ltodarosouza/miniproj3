"use client";

import { useEffect, useRef, useState } from "react";

import { vibrar, prefereMenosMovimento } from "@/lib/movimento";
import { Icone } from "./Icone";

type PosicaoToque = { tempo: number; x: number; y: number };

export function ToqueDuplo({
  aoToqueDuplo,
  children,
  className,
}: {
  aoToqueDuplo: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const toqueAnterior = useRef<PosicaoToque | null>(null);
  const toqueDuploRecente = useRef(0);
  const coracaoRef = useRef<HTMLSpanElement>(null);
  const [disparo, setDisparo] = useState(0);

  function dispararToqueDuplo() {
    aoToqueDuplo();
    vibrar(10);
    setDisparo((atual) => atual + 1);
  }

  function aoPointerUp(evento: React.PointerEvent<HTMLDivElement>) {
    const agora = Date.now();
    const anterior = toqueAnterior.current;
    const distancia = anterior
      ? Math.hypot(evento.clientX - anterior.x, evento.clientY - anterior.y)
      : Infinity;

    if (anterior && agora - anterior.tempo <= 300 && distancia < 30) {
      toqueAnterior.current = null;
      toqueDuploRecente.current = agora;
      dispararToqueDuplo();
      return;
    }

    toqueAnterior.current = { tempo: agora, x: evento.clientX, y: evento.clientY };
  }

  function aoDoubleClick() {
    if (Date.now() - toqueDuploRecente.current < 400) return;
    toqueDuploRecente.current = Date.now();
    dispararToqueDuplo();
  }

  useEffect(() => {
    const elemento = coracaoRef.current;
    if (!elemento || !disparo) return;

    if (prefereMenosMovimento()) {
      elemento.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }],
        { duration: 400, easing: "ease-out" }
      );
      return;
    }

    elemento.animate(
      [
        { transform: "translateY(0) scale(0)", opacity: 0, offset: 0 },
        { transform: "translateY(0) scale(1.15)", opacity: 1, offset: 0.25 },
        { transform: "translateY(0) scale(1)", opacity: 1, offset: 0.4 },
        { transform: "translateY(-12px) scale(1)", opacity: 0, offset: 1 },
      ],
      { duration: 800, easing: "ease-out" }
    );
  }, [disparo]);

  return (
    <div
      className={`relative touch-manipulation select-none ${className ?? ""}`}
      onPointerUp={aoPointerUp}
      onDoubleClick={aoDoubleClick}
    >
      {children}
      {disparo > 0 && (
        <span
          key={disparo}
          ref={coracaoRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-perigo drop-shadow-lg opacity-0"
        >
          <Icone nome="coracao" tamanho={88} preenchido />
        </span>
      )}
    </div>
  );
}
