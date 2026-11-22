"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { Revelar } from "@/components/ui/Revelar";
import { NOME_REDE } from "@/lib/marca";
import { temToken } from "@/lib/sessao";

const passos = [
  {
    icone: "perfil" as const,
    titulo: "Monte seu perfil",
    descricao: "Conte o que você sabe e o que quer aprender.",
  },
  {
    icone: "troca" as const,
    titulo: "Veja seus matches",
    descricao: "Encontre quem pode te ensinar e com quem trocar.",
  },
  {
    icone: "calendario" as const,
    titulo: "Combine a troca",
    descricao: "Conversem, agendem e avaliem depois.",
  },
];

export default function Inicio() {
  const router = useRouter();
  const [apresentar, setApresentar] = useState<boolean | null>(null);

  useEffect(() => {
    if (temToken()) {
      router.replace("/feed");
      return;
    }
    setApresentar(true);
  }, [router]);

  if (apresentar !== true) return <div className="min-h-[60vh]" />;

  return (
    <div>
      <section className="mx-auto max-w-2xl py-12 text-center sm:py-20">
        <h1 className="text-4xl font-semibold leading-tight tracking-[-0.03em] text-texto sm:text-5xl">
          Troque o que você sabe pelo que quer aprender.
        </h1>
        <p className="mt-4 text-[1.0625rem] leading-relaxed text-texto-2">
          Na {NOME_REDE}, diga o que sabe e o que quer aprender. A gente mostra quem pode te ensinar e com quem dá para trocar, sem dinheiro no meio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <BotaoLink href="/cadastro" magnetico>
            Criar conta
          </BotaoLink>
          <BotaoLink href="/login" variante="secundario">
            Já tenho conta
          </BotaoLink>
        </div>
      </section>

      <section aria-label="Como funciona" className="mt-4 grid gap-4 sm:grid-cols-3">
        {passos.map((passo, i) => (
          <Revelar key={passo.titulo} atraso={i * 60}>
            <Cartao className="p-5">
              <div className="flex size-9 items-center justify-center rounded-controle bg-marca-suave text-marca-forte">
                <Icone nome={passo.icone} />
              </div>
              <h2 className="mt-4 font-medium text-texto">{passo.titulo}</h2>
              <p className="mt-1 text-sm text-texto-2">{passo.descricao}</p>
            </Cartao>
          </Revelar>
        ))}
      </section>
    </div>
  );
}
