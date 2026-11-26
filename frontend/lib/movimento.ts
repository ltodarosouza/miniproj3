"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function prefereMenosMovimento(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Sem opções, revela quando o elemento já entrou um pouco na tela.
// Com `antecipacao` (ex.: "200px"), revela essa distância antes de entrar.
export function useVisivel<T extends HTMLElement>(
  { antecipacao }: { antecipacao?: string } = {}
): [RefObject<T | null>, boolean] {
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
      antecipacao
        ? { rootMargin: `0px 0px ${antecipacao} 0px`, threshold: 0 }
        : { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, [antecipacao]);

  return [ref, visivel];
}

export function vibrar(ms = 10): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(ms);
}
