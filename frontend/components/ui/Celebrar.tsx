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
  raio: number;
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
  const lerCor = (variavel: string) => estilos.getPropertyValue(variavel).trim();
  let mel = lerCor("--mel") || lerCor("--troca");
  let grafite = lerCor("--grafite") || lerCor("--texto");
  if (!mel && !grafite) mel = grafite = "currentColor";
  else {
    mel ||= grafite;
    grafite ||= mel;
  }

  const particulas: Particula[] = Array.from({ length: 40 }, (_, indice) => {
    const lado = indice % 2 === 0 ? 0.1 : 0.9;
    const angulo = (55 + Math.random() * 25) * (Math.PI / 180);
    const velocidade = 10 + Math.random() * 4;
    const direcao = lado === 0.1 ? 1 : -1;
    return {
      x: largura * lado,
      y: altura,
      vx: Math.cos(angulo) * velocidade * direcao,
      vy: -Math.sin(angulo) * velocidade,
      rotacao: Math.random() * Math.PI * 2,
      velocidadeRotacao: (Math.random() - 0.5) * 0.28,
      raio: 3 + Math.random() * 2.5,
      cor: Math.random() < 0.65 ? mel : grafite,
    };
  });

  const inicio = performance.now();
  let quadro = 0;
  function desenhar(agora: number) {
    const decorrido = agora - inicio;
    if (decorrido >= 1100) {
      cancelAnimationFrame(quadro);
      canvas.remove();
      return;
    }

    contexto!.clearRect(0, 0, largura, altura);
    contexto!.globalAlpha = decorrido > 800 ? 1 - (decorrido - 800) / 300 : 1;
    for (const particula of particulas) {
      contexto!.save();
      contexto!.translate(particula.x, particula.y);
      contexto!.rotate(particula.rotacao);
      contexto!.fillStyle = particula.cor;
      contexto!.beginPath();
      for (let vertice = 0; vertice < 6; vertice += 1) {
        const angulo = (vertice * Math.PI) / 3;
        const x = Math.cos(angulo) * particula.raio;
        const y = Math.sin(angulo) * particula.raio;
        if (vertice === 0) contexto!.moveTo(x, y);
        else contexto!.lineTo(x, y);
      }
      contexto!.closePath();
      contexto!.fill();
      contexto!.restore();
      particula.x += particula.vx;
      particula.y += particula.vy;
      particula.vy += 0.35;
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
