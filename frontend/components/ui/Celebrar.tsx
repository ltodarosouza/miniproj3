"use client";

import { useEffect, useRef } from "react";
import { prefereMenosMovimento } from "@/lib/movimento";

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotacao: number;
  velocidadeRotacao: number;
  cor: string;
};

export function celebrar(): void {
  if (typeof window === "undefined" || prefereMenosMovimento()) return;

  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const proporcao = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(largura * proporcao);
  canvas.height = Math.round(altura * proporcao);
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: `${largura}px`,
    height: `${altura}px`,
    pointerEvents: "none",
    zIndex: "60",
  });
  document.body.appendChild(canvas);

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    canvas.remove();
    return;
  }
  contexto.scale(proporcao, proporcao);

  const estilos = getComputedStyle(document.documentElement);
  const cores = ["--marca", "--troca", "--estrela", "--marca-suave"]
    .map((variavel) => estilos.getPropertyValue(variavel).trim())
    .filter(Boolean);
  if (cores.length === 0) cores.push("currentColor");

  const particulas: Particula[] = Array.from({ length: 70 }, (_, indice) => {
    const lado = indice % 2 === 0 ? 0.1 : 0.9;
    const angulo = (55 + Math.random() * 25) * (Math.PI / 180);
    const velocidade = 9 + Math.random() * 6;
    const direcao = lado === 0.1 ? 1 : -1;
    return {
      x: largura * lado,
      y: altura,
      vx: Math.cos(angulo) * velocidade * direcao,
      vy: -Math.sin(angulo) * velocidade,
      rotacao: Math.random() * Math.PI * 2,
      velocidadeRotacao: (Math.random() - 0.5) * 0.28,
      cor: cores[Math.floor(Math.random() * cores.length)],
    };
  });

  const inicio = performance.now();
  let quadro = 0;
  function desenhar(agora: number) {
    const decorrido = agora - inicio;
    if (decorrido >= 1800) {
      cancelAnimationFrame(quadro);
      canvas.remove();
      return;
    }

    contexto!.clearRect(0, 0, largura, altura);
    contexto!.globalAlpha = decorrido > 1400 ? 1 - (decorrido - 1400) / 400 : 1;
    for (const particula of particulas) {
      contexto!.save();
      contexto!.translate(particula.x, particula.y);
      contexto!.rotate(particula.rotacao);
      contexto!.fillStyle = particula.cor;
      contexto!.fillRect(-3, -5, 6, 10);
      contexto!.restore();
      particula.x += particula.vx;
      particula.y += particula.vy;
      particula.vy += 0.3;
      particula.vx *= 0.985;
      particula.vy *= 0.985;
      particula.rotacao += particula.velocidadeRotacao;
    }
    contexto!.globalAlpha = 1;
    quadro = requestAnimationFrame(desenhar);
  }

  quadro = requestAnimationFrame(desenhar);
}

export function Celebrar({ quando }: { quando: boolean }): null {
  const anterior = useRef(false);

  useEffect(() => {
    if (quando && !anterior.current) celebrar();
    anterior.current = quando;
  }, [quando]);

  return null;
}
