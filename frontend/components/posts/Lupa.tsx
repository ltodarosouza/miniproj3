"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { Icone } from "@/components/ui/Icone";
import { prefereMenosMovimento } from "@/lib/movimento";
import { travarRolagem } from "@/lib/rolagem";

// Visualizador da foto (decisões 42 e 43): a foto vem num cartão com a legenda do post,
// sobre o fundo escurecido e desfocado; o ✕ fica no topo do cartão, ao lado da legenda. Fecha com Esc, ✕ ou clique fora; enquanto aberto
// a página não rola, e ao fechar o foco volta para quem abriu.
// Clique (ou Enter) na foto: zoom 2× ancorado no ponto, recortado pela moldura.
export function Lupa({
  aberta,
  src,
  alt,
  legenda,
  origem,
  aoFechar,
}: {
  aberta: boolean;
  src: string;
  alt: string;
  legenda?: ReactNode;
  origem?: RefObject<HTMLElement | null>;
  aoFechar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const figura = useRef<HTMLElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const liberar = useRef<(() => void) | null>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const aoFecharAtual = useRef(aoFechar);
  aoFecharAtual.current = aoFechar;

  // Desfaz tudo que a abertura fez; serve ao fechamento animado e ao fechamento nativo.
  function encerrar() {
    const elemento = dialogo.current;
    if (elemento) {
      delete elemento.dataset.fechando;
      if (elemento.open) elemento.close();
    }
    setZoom(null);
    if (liberar.current) {
      liberar.current();
      liberar.current = null;
      origem?.current?.focus({ preventScroll: true });
    }
  }

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (aberta) {
      delete elemento.dataset.fechando;
      if (!elemento.open) {
        liberar.current ??= travarRolagem();
        elemento.showModal();
        fechar.current?.focus();
      }
      return;
    }

    if (!elemento.open) return;
    if (prefereMenosMovimento()) {
      encerrar();
      return;
    }
    // Saída curta: o cartão encolhe e o fundo some antes do close() de verdade.
    elemento.dataset.fechando = "sim";
    const foto = figura.current;
    const terminar = () => encerrar();
    const reserva = window.setTimeout(terminar, 400);
    foto?.addEventListener("animationend", terminar, { once: true });
    return () => {
      window.clearTimeout(reserva);
      foto?.removeEventListener("animationend", terminar);
    };
    // encerrar só lê refs; não precisa entrar nas dependências.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);

  // Saindo da tela com a lupa aberta, a rolagem não pode ficar presa.
  useEffect(
    () => () => {
      liberar.current?.();
      liberar.current = null;
    },
    [],
  );

  function alternarZoom(evento: React.MouseEvent<HTMLButtonElement>) {
    if (zoom) {
      setZoom(null);
      return;
    }
    // Pelo teclado (detail 0) não há ponto de clique: o zoom ancora no centro.
    if (evento.detail === 0) {
      setZoom({ x: 50, y: 50 });
      return;
    }
    const caixa = evento.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((evento.clientX - caixa.left) / caixa.width) * 100,
      y: ((evento.clientY - caixa.top) / caixa.height) * 100,
    });
  }

  return (
    <dialog
      ref={dialogo}
      data-sem-toque-duplo
      aria-label={alt}
      onClick={(evento) => {
        if (!figura.current?.contains(evento.target as Node)) aoFecharAtual.current();
      }}
      onKeyDown={(evento) => {
        // Foco preso: o Tab circula entre o ✕ e a foto, sem escapar para a barra do navegador.
        if (evento.key !== "Tab") return;
        const alvos = [...(figura.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
        if (alvos.length === 0) return;
        const atual = alvos.indexOf(document.activeElement as HTMLButtonElement);
        const proximo = (atual + (evento.shiftKey ? -1 : 1) + alvos.length) % alvos.length;
        evento.preventDefault();
        alvos[proximo].focus();
      }}
      onCancel={(evento) => {
        evento.preventDefault();
        aoFecharAtual.current();
      }}
      onClose={() => {
        // O navegador pode fechar sozinho (Esc repetido no Chrome): limpa e avisa o cartão.
        if (!liberar.current) return;
        encerrar();
        aoFecharAtual.current();
      }}
      className="lupa fixed inset-0 m-0 hidden h-dvh max-h-none w-full max-w-none place-items-center overscroll-contain border-0 bg-transparent p-[var(--respiro)] [--respiro:1rem] open:grid sm:[--respiro:2rem]"
    >
      <figure
        ref={figura}
        className="lupa-foto flex min-w-[min(18rem,100%)] max-w-full flex-col overflow-hidden rounded-cartao border border-linha bg-superficie p-2 text-texto shadow-alta"
      >
        <figcaption className="flex min-h-12 items-center gap-2.5 pb-2 pl-1">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">{legenda}</div>
          <button
            ref={fechar}
            type="button"
            aria-label="Fechar foto"
            onClick={() => aoFecharAtual.current()}
            className="grid size-11 shrink-0 place-items-center rounded-controle text-texto-2 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
          >
            <Icone nome="fechar" tamanho={20} />
          </button>
        </figcaption>
        <button
          type="button"
          aria-pressed={zoom !== null}
          aria-label={zoom ? "Ajustar a foto à tela" : "Zoom 2× na foto"}
          onClick={alternarZoom}
          className={`block self-center overflow-hidden rounded-controle bg-superficie-2 ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        >
          <img
            src={src}
            alt={alt}
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            className="block max-h-[calc(100dvh-2*var(--respiro)-4.875rem)] max-[399px]:max-h-[calc(100dvh-2*var(--respiro)-6.625rem)] max-w-[calc(100vw-2*var(--respiro)-1.125rem)] object-contain transition-transform duration-[var(--medio)] ease-saida motion-reduce:transition-none"
          />
        </button>
      </figure>
    </dialog>
  );
}
