"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { logout } from "@/lib/api";
import { limparSessao, temToken } from "@/lib/sessao";

import { Botao } from "./Botao";
import { BotaoTema } from "./BotaoTema";
import { Icone, type NomeIcone } from "./Icone";

const ITENS: { href: string; rotulo: string; icone: NomeIcone }[] = [
  { href: "/feed", rotulo: "Feed", icone: "feed" },
  { href: "/matches", rotulo: "Matches", icone: "troca" },
  { href: "/mensagens", rotulo: "Mensagens", icone: "mensagem" },
  { href: "/perfil/eu", rotulo: "Perfil", icone: "perfil" },
];

export function Navegacao({ nomeRede }: { nomeRede: string }) {
  const caminho = usePathname();
  const router = useRouter();
  const lista = useRef<HTMLUListElement>(null);
  const [pilula, setPilula] = useState<{ x: number; w: number } | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    setLogado(temToken());
  }, [caminho]);

  const ativo =
    ITENS.find((item) =>
      item.href === "/feed"
        ? caminho === "/feed" || caminho.startsWith("/posts")
        : caminho.startsWith(item.href.replace("/eu", "")),
    )?.href ?? null;
  const alvo = sobre ?? ativo;

  useLayoutEffect(() => {
    const ul = lista.current;
    if (!ul || !alvo) {
      setPilula(null);
      return;
    }
    const item = ul.querySelector<HTMLElement>(`[data-href="${alvo}"]`)?.parentElement;
    if (!item) return;
    setPilula({ x: item.offsetLeft, w: item.offsetWidth });
  }, [alvo, logado]);

  async function sair() {
    try {
      await logout();
    } catch {}
    limparSessao();
    setLogado(false);
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-linha bg-[color-mix(in_oklch,var(--fundo)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-texto"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-marca text-marca-texto">
            <Icone nome="troca" tamanho={16} />
          </span>
          {nomeRede}
        </Link>

        {logado === true && (
          <div className="flex items-center gap-1">
            <ul
              ref={lista}
              className="relative flex items-center gap-1"
              onPointerLeave={() => setSobre(null)}
            >
              {pilula && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-9 rounded-controle bg-superficie-2 transition-[transform,width] duration-[var(--medio)] ease-saida"
                  style={{ transform: `translateX(${pilula.x}px)`, width: pilula.w }}
                />
              )}
              {ITENS.map((item) => (
                <li key={item.href} className="relative">
                  <Link
                    href={item.href}
                    data-href={item.href}
                    onPointerEnter={() => setSobre(item.href)}
                    aria-current={ativo === item.href ? "page" : undefined}
                    className={`flex h-9 items-center gap-2 rounded-controle px-2.5 text-sm font-medium sm:px-3 transition-colors duration-[var(--rapido)] ${
                      ativo === item.href ? "text-marca-forte" : "text-texto-2 hover:text-texto"
                    }`}
                  >
                    <Icone nome={item.icone} tamanho={18} />
                    <span className="hidden sm:inline">{item.rotulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <BotaoTema />
            <button
              type="button"
              onClick={sair}
              className="flex h-9 items-center rounded-controle px-2.5 text-sm font-medium text-texto-2 sm:px-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto"
            >
              Sair
            </button>
          </div>
        )}

        {logado === false && (
          <div className="flex items-center gap-1.5">
            <BotaoTema />
            <Botao variante="fantasma" tamanho="sm" onClick={() => router.push("/login")}>
              Entrar
            </Botao>
            <Botao tamanho="sm" onClick={() => router.push("/cadastro")}>
              Criar conta
            </Botao>
          </div>
        )}
      </nav>
    </header>
  );
}
