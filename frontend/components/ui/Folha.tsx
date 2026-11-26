"use client";

import { useEffect, useId, useRef } from "react";

export function Folha({
  aberta,
  aoFechar,
  titulo,
  children,
  className,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const arraste = useRef({ inicioY: 0, inicioTempo: 0, dy: 0, ativo: false });

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    elemento.style.transform = "";
    elemento.style.transition = "";
    if (aberta && !elemento.open) elemento.showModal();
    else if (!aberta && elemento.open) elemento.close();
  }, [aberta]);

  function iniciarArraste(evento: React.PointerEvent<HTMLButtonElement>) {
    const elemento = dialogo.current;
    if (!elemento) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arraste.current = {
      inicioY: evento.clientY,
      inicioTempo: performance.now(),
      dy: 0,
      ativo: true,
    };
    elemento.style.transition = "none";
  }

  function moverArraste(evento: React.PointerEvent<HTMLButtonElement>) {
    const estado = arraste.current;
    const elemento = dialogo.current;
    if (!estado.ativo || !elemento) return;
    estado.dy = Math.max(0, evento.clientY - estado.inicioY);
    elemento.style.transform = `translateY(${estado.dy}px)`;
  }

  function finalizarArraste() {
    const estado = arraste.current;
    const elemento = dialogo.current;
    if (!estado.ativo || !elemento) return;
    estado.ativo = false;
    if (estado.dy < 4) {
      elemento.style.transform = "";
      elemento.style.transition = "";
      aoFechar();
      return;
    }

    const velocidade = estado.dy / Math.max(1, performance.now() - estado.inicioTempo);
    if (estado.dy > 100 || velocidade > 0.6) {
      aoFechar();
      return;
    }

    elemento.style.transition = "transform var(--medio) var(--ease-saida)";
    elemento.style.transform = "translateY(0)";
    const limpar = () => {
      elemento.style.transform = "";
      elemento.style.transition = "";
      elemento.removeEventListener("transitionend", limpar);
    };
    elemento.addEventListener("transitionend", limpar);
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault();
        aoFechar();
      }}
      onClick={(evento) => {
        if (evento.target !== dialogo.current) return;
        const caixa = dialogo.current.getBoundingClientRect();
        const dentro =
          evento.clientX >= caixa.left &&
          evento.clientX <= caixa.right &&
          evento.clientY >= caixa.top &&
          evento.clientY <= caixa.bottom;
        if (!dentro) aoFechar();
      }}
      className={`m-auto w-[min(28rem,calc(100vw-2rem))] rounded-cartao border border-linha bg-superficie p-5 text-texto shadow-alta backdrop:bg-[rgb(18_17_16/0.55)] max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-cartao max-sm:rounded-b-none max-sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-sm:open:animate-[subir-folha_var(--medio)_var(--ease-saida)_both] sm:open:animate-[aparecer-escala_var(--medio)_var(--ease-saida)_both] motion-reduce:open:animate-none ${className ?? ""}`}
    >
      <button
        type="button"
        className="-mt-5 flex h-11 w-full touch-none items-center justify-center sm:hidden"
        aria-label="Fechar"
        onPointerDown={iniciarArraste}
        onPointerMove={moverArraste}
        onPointerUp={finalizarArraste}
        onPointerCancel={finalizarArraste}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            aoFechar();
          }
        }}
      >
        <span aria-hidden="true" className="h-1 w-10 rounded-[2px] bg-linha-forte" />
      </button>
      <h2 id={idTitulo} className="font-display text-lg font-semibold tracking-[-0.02em]">
        {titulo}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </dialog>
  );
}
