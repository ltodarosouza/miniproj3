"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Botao } from "./Botao";
import { BotaoTema } from "./BotaoTema";
import { CabecalhoCelular } from "./CabecalhoCelular";
import { Logo } from "./Logo";
import { NavegacaoLateral } from "./NavegacaoLateral";
import { BarraInferior } from "./BarraInferior";
import { useLogado } from "./casca";
import { useSelos } from "./useSelos";
import { useStreak } from "./useStreak";

export function Navegacao({ nomeRede }: { nomeRede: string }) {
  const logado = useLogado();
  const naoLidas = useSelos();
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
    <header className="sticky top-0 z-40 h-14 border-b border-linha bg-superficie">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label={nomeRede} className="flex items-center rounded-controle text-texto">
          <Logo variante="completo" tamanho="sm" />
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
