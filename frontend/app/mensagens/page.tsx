"use client";

import { useRouter } from "next/navigation";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export default function MensagensPage() {
  const router = useRouter();

  return (
    <div className="hidden h-full min-h-0 flex-col items-center justify-center px-6 text-center md:flex">
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-marca-suave text-marca-forte">
        <Icone nome="mensagem" tamanho={25} />
      </span>
      <h2 className="text-lg font-semibold tracking-tight text-texto">Suas conversas</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-texto-2">
        Escolha uma conversa ao lado ou encontre alguém nos seus matches para combinar uma troca.
      </p>
      <Botao className="mt-5" onClick={() => router.push("/matches")}>Ver meus matches</Botao>
    </div>
  );
}
