"use client";

import { useEffect, useRef, useState } from "react";

import { FormNovoPost } from "@/components/posts/FormNovoPost";
import { Cartao } from "@/components/ui/Cartao";
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
      <Cartao className="p-2">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex w-full items-center gap-3 rounded-controle px-3 py-3 text-left text-[0.9375rem] text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
        >
          <Icone nome="mais" tamanho={18} />
          O que você estudou hoje?
        </button>
      </Cartao>
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
