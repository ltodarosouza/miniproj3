"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BotaoTema } from "./BotaoTema";
import { HREF_PUBLICAR, ITENS_LATERAL, rotaAtiva, useSair } from "./casca";
import { Icone } from "./Icone";
import { Logo } from "./Logo";
import { SeloContador } from "./SeloContador";
import { Streak } from "./Streak";

export function NavegacaoLateral({
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

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-y-0 left-0 z-40 hidden w-(--largura-lateral) flex-col border-r border-linha bg-superficie px-3 py-4 lg:flex xl:px-4"
    >
      <div className="mb-5 flex flex-col items-center gap-2 xl:items-start">
        <Link
          href="/feed"
          aria-label={nomeRede}
          title={nomeRede}
          className="flex min-h-9 items-center rounded-controle text-texto"
        >
          <span className="xl:hidden">
            <Logo variante="simbolo" tamanho="md" />
          </span>
          <span className="hidden xl:block">
            <Logo variante="completo" tamanho="md" />
          </span>
        </Link>
        {streak ? (
          <Streak dias={streak.dias} postouHoje={streak.postouHoje} alinharDica="inicio" compacto className="xl:-ml-2" />
        ) : null}
      </div>

      <div className="-mx-3 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain px-3 [scrollbar-width:none]! *:shrink-0 [&::-webkit-scrollbar]:hidden xl:-mx-4 xl:px-4">
        <ul className="flex flex-col gap-0.5">
          {ITENS_LATERAL.map((item) => {
            const ativo = rotaAtiva(caminho, item.href);
            const comSelo = item.href === "/mensagens" || item.href === "/notificacoes";
            const totalNaoLidas =
              item.href === "/mensagens"
                ? naoLidas.mensagens
                : item.href === "/notificacoes"
                  ? naoLidas.notificacoes
                  : null;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={ativo ? "page" : undefined}
                  title={item.rotulo}
                  className={`relative flex h-10 items-center justify-center gap-3 rounded-controle text-[0.9375rem] transition-colors duration-[var(--rapido)] motion-reduce:transition-none xl:justify-start xl:px-2 ${
                    ativo
                      ? "bg-superficie-2 font-semibold text-texto before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:bg-marca before:content-['']"
                      : "font-medium text-texto-2 hover:bg-superficie-2 hover:text-texto"
                  }`}
                >
                  <span className="relative flex shrink-0 items-center justify-center">
                    <Icone nome={item.icone} tamanho={20} />
                    {comSelo ? (
                      <span className="absolute -right-2.5 -top-2 xl:hidden">
                        <SeloContador total={totalNaoLidas} />
                      </span>
                    ) : null}
                  </span>
                  <span className="sr-only xl:not-sr-only">{item.rotulo}</span>
                  {comSelo ? (
                    <span className="ml-auto hidden xl:block">
                      <SeloContador total={totalNaoLidas} />
                    </span>
                  ) : null}
                  {totalNaoLidas !== null && totalNaoLidas > 0 ? (
                    <span className="sr-only">, {totalNaoLidas} não lidas</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href={HREF_PUBLICAR}
          title="Publicar"
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-controle bg-marca font-semibold text-marca-texto transition-colors duration-[var(--rapido)] hover:bg-marca/90 motion-reduce:transition-none"
        >
          <Icone nome="mais" tamanho={18} />
          <span className="sr-only xl:not-sr-only">Publicar</span>
        </Link>

        <div className="mt-auto flex flex-col items-center gap-0.5 border-t border-linha pt-3 xl:items-stretch">
          <div className="flex items-center justify-center xl:justify-between xl:pl-2">
            <span className="sr-only text-[0.9375rem] font-medium text-texto-2 xl:not-sr-only">Tema</span>
            <BotaoTema />
          </div>
          <button
            type="button"
            onClick={() => void sair()}
            title="Sair"
            className="flex h-10 w-full items-center justify-center gap-3 rounded-controle text-[0.9375rem] font-medium text-texto-2 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none xl:justify-start xl:px-2"
          >
            <Icone nome="sair" tamanho={20} />
            <span className="sr-only xl:not-sr-only">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
