"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function prefereMenosMovimento(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useMagnetico<T extends HTMLElement>(_forca = 0.25): RefObject<T | null> {
  return useRef<T>(null);
}

export function useVisivel<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefereMenosMovimento() || !("IntersectionObserver" in window)) {
      setVisivel(true);
      return;
    }
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return [ref, visivel];
}

type Mola = { rigidez: number; amortecimento: number };

export const MOLA_SUAVE: Mola = { rigidez: 170, amortecimento: 22 };

export function animarMola(
  de: { x: number; y: number },
  aplicar: (x: number, y: number) => void,
  aoTerminar?: () => void,
  mola: Mola = MOLA_SUAVE
): () => void {
  if (prefereMenosMovimento()) {
    aplicar(0, 0);
    aoTerminar?.();
    return () => {};
  }
  let x = de.x;
  let y = de.y;
  let vx = 0;
  let vy = 0;
  let anterior = performance.now();
  let quadro = 0;

  function passo(agora: number) {
    const dt = Math.min((agora - anterior) / 1000, 1 / 30);
    anterior = agora;
    vx += (-mola.rigidez * x - mola.amortecimento * vx) * dt;
    vy += (-mola.rigidez * y - mola.amortecimento * vy) * dt;
    x += vx * dt;
    y += vy * dt;
    aplicar(x, y);
    if (Math.abs(x) + Math.abs(y) < 0.3 && Math.abs(vx) + Math.abs(vy) < 0.3) {
      aplicar(0, 0);
      aoTerminar?.();
      return;
    }
    quadro = requestAnimationFrame(passo);
  }

  quadro = requestAnimationFrame(passo);
  return () => cancelAnimationFrame(quadro);
}

export function vibrar(ms = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(ms);
}
