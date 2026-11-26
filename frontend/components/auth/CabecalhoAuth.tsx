import type { ReactNode } from "react";

import { Logo } from "@/components/ui/Logo";
import { NOME_REDE } from "@/lib/marca";

// Tela dividida da entrada: painel grafite à esquerda no computador e o
// formulário à direita. No celular fica só o formulário; o logo vem do cabeçalho do site.
export function TelaAuth({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden lg:min-h-[36rem] lg:rounded-cartao lg:border lg:border-linha lg:bg-superficie lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-grafite p-10 text-grafite-texto lg:flex">
        <Logo variante="simbolo" tamanho="lg" className="size-16" />
        <div>
          <p className="font-display text-4xl font-bold tracking-[-0.03em]">{NOME_REDE}</p>
          <p className="mt-3 max-w-xs text-[1.0625rem] leading-relaxed opacity-80">
            Troque o que você sabe pelo que você quer aprender.
          </p>
        </div>
        <p className="font-mono text-xs opacity-60">Git ↔ Python · React ↔ SQL · Cálculo 1 ↔ Inglês técnico</p>
      </aside>
      <div className="flex items-center justify-center py-4 sm:px-10 sm:py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

export function CabecalhoAuth({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-bold tracking-[-0.02em] text-texto">{titulo}</h1>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-texto-2">{descricao}</p>
    </div>
  );
}
