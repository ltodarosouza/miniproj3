"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { prefereMenosMovimento, vibrar } from "@/lib/movimento";
import { Icone } from "./Icone";

export function BotaoCurtir({
  curtido,
  total,
  aoAlternar,
}: {
  curtido: boolean;
  total: number;
  aoAlternar: () => boolean | void;
}) {
  const [pulso, setPulso] = useState(0);
  const [explosao, setExplosao] = useState(0);
  const particulas = useRef<(HTMLSpanElement | null)[]>([]);
  const contador = useRef<HTMLSpanElement>(null);
  const totalAnterior = useRef(total);

  useLayoutEffect(() => {
    const anterior = totalAnterior.current;
    totalAnterior.current = total;
    const el = contador.current;
    if (!el || anterior === total || prefereMenosMovimento()) return;
    const direcao = total > anterior ? -1 : 1;
    el.animate(
      [
        { transform: `translateY(${direcao * -60}%)`, opacity: 0 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 240, easing: "ease-out" }
    );
  }, [total]);

  useLayoutEffect(() => {
    if (!explosao || prefereMenosMovimento()) return;
    particulas.current.forEach((el, i) => {
      if (!el) return;
      const angulo = (i * 60 * Math.PI) / 180;
      const dx = Math.cos(angulo) * 14;
      const dy = Math.sin(angulo) * 14;
      el.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) scale(0)`, opacity: 0 },
        ],
        { duration: 520, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
    });
  }, [explosao]);

  return (
    <button
      type="button"
      aria-pressed={curtido}
      aria-label={curtido ? "Descurtir" : "Curtir"}
      onClick={() => {
        // Clique ignorado (curtida anterior ainda no servidor) não anima nem vibra.
        if (aoAlternar() === false) return;
        if (!curtido) {
          setPulso((p) => p + 1);
          vibrar(10);
          setExplosao((p) => p + 1);
        }
      }}
      className={`group inline-flex h-8 items-center gap-1.5 rounded-controle px-2 text-sm transition-colors duration-[var(--rapido)] ${
        curtido ? "text-marca-forte" : "text-texto-3 hover:bg-superficie-2 hover:text-texto"
      }`}
    >
      <span key={pulso} className={`relative ${pulso ? "[animation:pulsar-coracao_520ms_var(--ease-mola)]" : ""}`}>
        <Icone nome="coracao" tamanho={16} preenchido={curtido} />
        <span className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              ref={(el) => { particulas.current[i] = el; }}
              className={`absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] size-1.5 rounded-full opacity-0 ${i % 2 === 0 ? "bg-marca" : "bg-texto"}`}
            />
          ))}
        </span>
      </span>
      <span className="relative inline-grid h-5 overflow-hidden leading-5">
        <span key={total} ref={contador} className="numeros">{total}</span>
      </span>
    </button>
  );
}
