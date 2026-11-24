"use client";

import { useEffect, useRef, useState } from "react";

import { vibrar, prefereMenosMovimento } from "@/lib/movimento";
import { Icone } from "./Icone";

type PosicaoToque = { tempo: number; x: number; y: number };

const INTERATIVOS = "a, button, input, textarea, select, label, [role=button], [contenteditable=true], [data-sem-toque-duplo]";

function comecouEmInterativo(alvo: EventTarget | null, raiz: HTMLElement) {
  if (!(alvo instanceof Element)) return false;
  const interativo = alvo.closest(INTERATIVOS);
  return interativo !== null && raiz.contains(interativo);
}

export function ToqueDuplo({
  aoToqueDuplo,
  children,
  className,
  desativado = false,
}: {
  aoToqueDuplo: () => void;
  children: React.ReactNode;
  className?: string;
  desativado?: boolean;
}) {
  const toqueAnterior = useRef<PosicaoToque | null>(null);
  const inicioToque = useRef<{ x: number; y: number; semSelecao: boolean } | null>(null);
  const coracaoRef = useRef<HTMLSpanElement>(null);
  const [disparo, setDisparo] = useState(0);

  function dispararToqueDuplo() {
    aoToqueDuplo();
    vibrar(10);
    setDisparo((atual) => atual + 1);
  }

  function semSelecao() {
    return window.getSelection()?.isCollapsed !== false;
  }

  function cancelarGesto() {
    inicioToque.current = null;
    toqueAnterior.current = null;
  }

  function aoPointerDown(evento: React.PointerEvent<HTMLDivElement>) {
    // Só o primeiro dedo conta: um segundo dedo (pinça) cancela o gesto.
    if (!evento.isPrimary) {
      cancelarGesto();
      return;
    }
    inicioToque.current = { x: evento.clientX, y: evento.clientY, semSelecao: semSelecao() };
  }

  function aoPointerUp(evento: React.PointerEvent<HTMLDivElement>) {
    if (!evento.isPrimary) return;
    const inicio = inicioToque.current;
    inicioToque.current = null;
    // Sem pointerdown válido (arrasto que começou fora do post, ou gesto cancelado por rolagem ou por um segundo dedo) não conta como toque.
    const arrastou = !inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 10;
    // Só descarta se a seleção de texto surgiu durante este gesto; uma seleção antiga em outro lugar da página não bloqueia.
    const selecionou = inicio !== null && inicio.semSelecao && !semSelecao();
    if (desativado || arrastou || selecionou || comecouEmInterativo(evento.target, evento.currentTarget)) {
      toqueAnterior.current = null;
      return;
    }
    const agora = Date.now();
    const anterior = toqueAnterior.current;
    const distancia = anterior
      ? Math.hypot(evento.clientX - anterior.x, evento.clientY - anterior.y)
      : Infinity;

    // No mouse e na caneta, acompanha o intervalo de duplo clique do sistema (cerca de 500 ms no Windows).
    const limite = evento.pointerType === "touch" ? 300 : 500;
    if (anterior && agora - anterior.tempo <= limite && distancia < 30) {
      toqueAnterior.current = null;
      dispararToqueDuplo();
      return;
    }

    toqueAnterior.current = { tempo: agora, x: evento.clientX, y: evento.clientY };
  }

  function aoMouseDown(evento: React.MouseEvent<HTMLDivElement>) {
    // Impede que o duplo clique selecione uma palavra, sem bloquear a seleção arrastando o mouse
    // nem o triplo clique, que seleciona o parágrafo.
    if (evento.detail === 2 && !desativado && !comecouEmInterativo(evento.target, evento.currentTarget)) {
      evento.preventDefault();
    }
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
      className={`relative touch-manipulation ${className ?? ""}`}
      onPointerDown={aoPointerDown}
      onPointerUp={aoPointerUp}
      onPointerCancel={cancelarGesto}
      onMouseDown={aoMouseDown}
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
