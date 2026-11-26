"use client";

import { useRouter } from "next/navigation";

import { Botao } from "@/components/ui/Botao";

export default function MensagensPage() {
  const router = useRouter();

  return (
    <div className="hidden h-full min-h-0 flex-col justify-center px-10 md:flex">
      <div className="max-w-sm">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-3">Nenhuma conversa aberta</p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-texto">Suas conversas</h2>
        <p className="mt-2 text-sm leading-relaxed text-texto-2">
          Escolha uma conversa ao lado ou encontre alguém nos seus matches para combinar uma troca.
        </p>
        <Botao className="mt-5" onClick={() => router.push("/matches")}>Ver meus matches</Botao>
      </div>
    </div>
  );
}
