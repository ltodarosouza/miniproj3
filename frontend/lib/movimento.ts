"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function prefereMenosMovimento(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useHolofote<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefereMenosMovimento()) return;

    function mover(e: PointerEvent) {
      const caixa = el!.getBoundingClientRect();
      el!.style.setProperty("--mx", `${e.clientX - caixa.left}px`);
      el!.style.setProperty("--my", `${e.clientY - caixa.top}px`);
    }
    const entrar = () => el.style.setProperty("--holofote", "1");
    const sair = () => el.style.setProperty("--holofote", "0");

    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerenter", entrar);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerenter", entrar);
      el.removeEventListener("pointerleave", sair);
    };
  }, []);

  return ref;
}

export function useMagnetico<T extends HTMLElement>(forca = 0.25): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefereMenosMovimento()) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    function mover(e: PointerEvent) {
      const caixa = el!.getBoundingClientRect();
      const dx = e.clientX - (caixa.left + caixa.width / 2);
      const dy = e.clientY - (caixa.top + caixa.height / 2);
      el!.style.transition = "transform 120ms var(--ease-saida)";
      el!.style.transform = `translate(${dx * forca}px, ${dy * forca}px)`;
    }
    function sair() {
      el!.style.transition = "transform 520ms var(--ease-mola)";
      el!.style.transform = "translate(0, 0)";
    }

    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
    };
  }, [forca]);

  return ref;
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
