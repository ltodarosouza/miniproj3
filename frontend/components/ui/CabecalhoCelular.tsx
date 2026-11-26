"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useSair, rotaAtiva } from "./casca";
import { BotaoTema } from "./BotaoTema";
import { Icone } from "./Icone";
import { Logo } from "./Logo";
import { SeloContador } from "./SeloContador";
import { Streak } from "./Streak";
import { Folha } from "./Folha";

export function CabecalhoCelular({
  nomeRede,
  naoLidas,
  streak,
}: {
  nomeRede: string;
  naoLidas: { mensagens: number | null; notificacoes: number | null };
  streak: { dias: number; postouHoje: boolean } | null;
}) {
  const caminho = usePathname();
  const sair = useSair();
  const [folhaAberta, setFolhaAberta] = useState(false);

  useEffect(() => {
    setFolhaAberta(false);
  }, [caminho]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const aoMudar = () => {
      if (desktop.matches) setFolhaAberta(false);
    };
    desktop.addEventListener("change", aoMudar);
    return () => desktop.removeEventListener("change", aoMudar);
  }, []);

  const linkAtivo = (href: string) => rotaAtiva(caminho, href);
  const rotuloComContagem = (rotulo: string, total: number | null) =>
    `${rotulo}${total !== null && total > 0 ? `, ${total} não lidas` : ""}`;

  return (
    <header className="sticky top-0 z-40 lg:hidden border-b border-linha bg-superficie pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between gap-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))]">
        <Link href="/feed" aria-label={nomeRede} className="inline-flex min-w-0 items-center rounded-controle text-texto">
          <Logo variante="completo" tamanho="sm" />
        </Link>

        <div className="flex items-center">
          {streak !== null && <Streak dias={streak.dias} postouHoje={streak.postouHoje} alinharDica="fim" />}
          <Link
            href="/notificacoes"
            aria-label={rotuloComContagem("Notificações", naoLidas.notificacoes)}
            aria-current={linkAtivo("/notificacoes") ? "page" : undefined}
            className={`relative inline-flex size-11 items-center justify-center transition-colors duration-[var(--rapido)] hover:text-texto ${linkAtivo("/notificacoes") ? "text-texto before:absolute before:inset-x-2.5 before:top-0 before:h-[2px] before:bg-marca before:content-['']" : "text-texto-2"}`}
          >
            <Icone nome="sino" tamanho={20} />
            <span className="absolute right-0.5 top-1.5"><SeloContador total={naoLidas.notificacoes} /></span>
          </Link>
          <Link
            href="/mensagens"
            aria-label={rotuloComContagem("Mensagens", naoLidas.mensagens)}
            aria-current={linkAtivo("/mensagens") ? "page" : undefined}
            className={`relative inline-flex size-11 items-center justify-center transition-colors duration-[var(--rapido)] hover:text-texto ${linkAtivo("/mensagens") ? "text-texto before:absolute before:inset-x-2.5 before:top-0 before:h-[2px] before:bg-marca before:content-['']" : "text-texto-2"}`}
          >
            <Icone nome="mensagem" tamanho={20} />
            <span className="absolute right-0.5 top-1.5"><SeloContador total={naoLidas.mensagens} /></span>
          </Link>
          <button
            type="button"
            aria-label="Mais opções"
            aria-haspopup="dialog"
            onClick={() => setFolhaAberta(true)}
            className="inline-flex size-11 items-center justify-center text-texto-2 transition-colors duration-[var(--rapido)] hover:text-texto"
          >
            <Icone nome="opcoes" tamanho={20} />
          </button>
        </div>
      </div>

      <Folha aberta={folhaAberta} aoFechar={() => setFolhaAberta(false)} titulo="Mais opções">
        <div className="flex h-12 items-center justify-between rounded-controle px-1">
          <span className="text-[0.9375rem] font-medium">Tema</span>
          <BotaoTema />
        </div>
        <button
          type="button"
          onClick={() => {
            setFolhaAberta(false);
            void sair();
          }}
          className="flex h-12 w-full items-center gap-3 rounded-controle px-3 text-[0.9375rem] font-medium text-perigo hover:bg-superficie-2"
        >
          <Icone nome="sair" tamanho={20} />
          Sair da conta
        </button>
      </Folha>
    </header>
  );
}
