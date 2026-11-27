"use client";

import { useEffect, useRef, useState } from "react";

import { Icone } from "@/components/ui/Icone";

// Visualizador da foto em tela cheia (decisão 42): fecha com Esc, ✕ ou toque fora.
// Clique na foto: zoom 2× ancorado — o transform-origin é o ponto clicado, que fica
// exatamente sob o cursor; outro clique volta a ajustar.
// Atalho: não há pan com arrasto no 2×; se o arrasto for pedido, volta o container rolável.
export function Lupa({ aberta, src, aoFechar }: { aberta: boolean; src: string; aoFechar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const foto = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (aberta && !elemento.open) elemento.showModal();
    // Reabrindo, a foto volta ajustada.
    else if (!aberta && elemento.open) {
      elemento.close();
      setZoom(null);
    }
  }, [aberta]);

  function alternarZoom(evento: React.MouseEvent<HTMLImageElement>) {
    evento.stopPropagation();
    const imagem = foto.current;
    if (!imagem || zoom) {
      setZoom(null);
      return;
    }
    const caixa = imagem.getBoundingClientRect();
    setZoom({
      x: ((evento.clientX - caixa.left) / caixa.width) * 100,
      y: ((evento.clientY - caixa.top) / caixa.height) * 100,
    });
  }

  return (
    <dialog
      ref={dialogo}
      data-sem-toque-duplo
      aria-label="Foto do post em tela cheia"
      onClick={aoFechar}
      onCancel={(evento) => {
        evento.preventDefault();
        aoFechar();
      }}
      className="fixed inset-0 m-0 hidden h-dvh max-h-none w-full max-w-none border-0 bg-[rgb(18_17_16/0.92)] p-0 text-transparent backdrop:bg-transparent open:block open:animate-[aparecer-escala_var(--rapido)_var(--ease-saida)_both] motion-reduce:open:animate-none"
    >
      <div className="grid h-dvh w-full place-items-center overflow-hidden p-4">
        <img
          ref={foto}
          src={src}
          alt="Foto do post em tela cheia"
          title={zoom ? "Clique para ajustar à tela" : "Clique para dar zoom no ponto"}
          onClick={alternarZoom}
          style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          className={`max-h-full max-w-full rounded-controle object-contain ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        />
      </div>
      <button
        type="button"
        aria-label="Fechar"
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-superficie/20 text-grafite-texto hover:bg-superficie/35"
      >
        <Icone nome="fechar" tamanho={18} />
      </button>
    </dialog>
  );
}
