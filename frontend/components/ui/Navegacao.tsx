"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Botao } from "./Botao";
import { BotaoTema } from "./BotaoTema";
import { CabecalhoCelular } from "./CabecalhoCelular";
import { Icone } from "./Icone";
import { NavegacaoLateral } from "./NavegacaoLateral";
import { BarraInferior } from "./BarraInferior";
import { useLogado } from "./casca";
import { useNaoLidas } from "./useNaoLidas";
import { useStreak } from "./useStreak";

export function Navegacao({ nomeRede }: { nomeRede: string }) {
  const logado = useLogado();
  const naoLidas = useNaoLidas();
  const streak = useStreak();
  const router = useRouter();

  useEffect(() => {
    if (logado !== null) {
      document.documentElement.dataset.logado = logado ? "sim" : "nao";
    }
  }, [logado]);

  if (logado === null) return null;

  if (logado) {
    return (
      <>
        <NavegacaoLateral nomeRede={nomeRede} naoLidas={naoLidas} streak={streak} />
        <CabecalhoCelular nomeRede={nomeRede} naoLidas={naoLidas} streak={streak} />
        <BarraInferior />
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-linha bg-[color-mix(in_oklch,var(--fundo)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-texto">
          <span className="flex size-7 items-center justify-center rounded-lg bg-marca text-marca-texto">
            <Icone nome="troca" tamanho={16} />
          </span>
          {nomeRede}
        </Link>
        <div className="flex items-center gap-1.5">
          <BotaoTema />
          <Botao variante="fantasma" tamanho="sm" onClick={() => router.push("/login")}>
            Entrar
          </Botao>
          <Botao tamanho="sm" onClick={() => router.push("/cadastro")}>
            Criar conta
          </Botao>
        </div>
      </nav>
    </header>
  );
}
