"use client";

import { useEffect, useRef } from "react";

import { Icone } from "@/components/ui/Icone";

// Visualizador da foto em tela cheia (decisão 41): ajusta a imagem à tela e fecha
// com Esc, no ✕ ou tocando fora. Fica na camada superior do <dialog>, acima da barra do celular.
export function Lupa({ aberta, src, aoFechar }: { aberta: boolean; src: string; aoFechar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;
    if (aberta && !elemento.open) elemento.showModal();
    else if (!aberta && elemento.open) elemento.close();
  }, [aberta]);

  return (
    <dialog
      ref={dialogo}
      aria-label="Foto do post em tela cheia"
      onClick={aoFechar}
      onCancel={(evento) => {
        evento.preventDefault();
        aoFechar();
      }}
      className="fixed inset-0 m-0 grid h-dvh w-full place-items-center border-0 bg-[rgb(18_17_16/0.92)] p-4 text-transparent backdrop:bg-transparent open:animate-[aparecer-escala_var(--rapido)_var(--ease-saida)_both] motion-reduce:open:animate-none"
    >
      <img
        src={src}
        alt="Foto do post em tela cheia"
        className="max-h-full max-w-full rounded-controle object-contain"
      />
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
