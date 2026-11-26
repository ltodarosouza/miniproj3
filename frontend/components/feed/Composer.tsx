"use client";

import { useEffect, useRef, useState } from "react";

import { FormNovoPost } from "@/components/posts/FormNovoPost";
import { Icone } from "@/components/ui/Icone";
import type { Post } from "@/lib/posts";

export function Composer({
  aoPublicar,
  pedidoDeAbrir = 0,
}: {
  aoPublicar: (post: Post) => void;
  pedidoDeAbrir?: number;
}) {
  const [aberto, setAberto] = useState(pedidoDeAbrir > 0);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pedidoDeAbrir > 0) {
      setAberto(true);
      caixa.current?.querySelector("textarea")?.focus();
    }
  }, [pedidoDeAbrir]);

  useEffect(() => {
    if (aberto) caixa.current?.querySelector("textarea")?.focus();
  }, [aberto]);

  if (!aberto) {
    return (
      // Uma linha só: parece um campo e abre o formulário completo ao clicar.
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="group flex h-11 w-full items-center gap-3 rounded-controle border border-linha bg-superficie pl-3 pr-1 text-left text-[0.9375rem] text-texto-3 transition-colors duration-[var(--rapido)] hover:border-linha-forte motion-reduce:transition-none"
      >
        <Icone nome="mais" tamanho={16} />
        <span className="min-w-0 flex-1 truncate">O que você estudou hoje?</span>
        <span aria-hidden="true" className="inline-flex h-9 shrink-0 items-center rounded-controle bg-marca px-3 text-sm font-semibold text-marca-texto group-hover:bg-marca/90">
          Registrar estudo
        </span>
      </button>
    );
  }

  return (
    <div ref={caixa}>
      <FormNovoPost
        aoPublicar={(post) => {
          aoPublicar(post);
          setAberto(false);
        }}
      />
    </div>
  );
}
