"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BotaoTema } from "./BotaoTema";
import { HREF_PUBLICAR, ITENS_LATERAL, rotaAtiva, useSair } from "./casca";
import { Icone } from "./Icone";
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
      className="fixed inset-y-3 left-3 z-40 hidden w-[4.5rem] flex-col rounded-cartao border border-linha bg-superficie p-3 shadow-cartao lg:flex xl:w-60 xl:p-4"
    >
      <div className="mb-4 flex flex-col items-center gap-2 xl:flex-row xl:gap-3">
        <Link
          href="/feed"
          className="flex min-h-9 items-center justify-center gap-2 text-texto xl:justify-start xl:gap-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-marca text-marca-texto">
            <Icone nome="troca" tamanho={18} />
          </span>
          <span className="hidden font-semibold tracking-tight xl:inline">{nomeRede}</span>
        </Link>
        {streak ? (
          <Streak
            dias={streak.dias}
            postouHoje={streak.postouHoje}
            alinharDica="inicio"
            className="xl:ml-auto"
          />
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto *:shrink-0 overflow-x-hidden overscroll-contain [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden -mx-3 px-3 xl:-mx-4 xl:px-4">
        <ul className="flex flex-col gap-1">
          {ITENS_LATERAL.map((item) => {
            const ativo = rotaAtiva(caminho, item.href);
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
                  className={`relative flex h-11 items-center justify-center gap-3 rounded-controle px-0 text-[0.9375rem] font-medium transition-colors duration-[var(--rapido)] motion-reduce:transition-none xl:justify-start ${
                    ativo
                      ? "font-semibold text-marca-forte before:absolute before:-left-3 before:inset-y-2.5 before:w-[3px] before:rounded-r-full before:bg-marca before:content-[''] xl:before:-left-4"
                      : "text-texto-2 hover:bg-superficie-2 hover:text-texto"
                  }`}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center">
                    <span className="relative flex shrink-0 items-center justify-center">
                      <Icone nome={item.icone} tamanho={22} />
                      {item.href === "/mensagens" || item.href === "/notificacoes" ? (
                        <SeloContador
                          total={totalNaoLidas}
                          className="absolute -right-2 -top-1.5"
                        />
                      ) : null}
                    </span>
                  </span>
                  <span className="sr-only xl:not-sr-only">{item.rotulo}</span>
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
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-controle bg-marca font-semibold text-marca-texto shadow-cartao transition-colors duration-[var(--rapido)] hover:bg-marca-forte active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Icone nome="mais" tamanho={20} />
          <span className="sr-only xl:not-sr-only">Publicar</span>
        </Link>

        <div className="mt-auto flex flex-col items-center gap-1 pt-4 xl:items-stretch">
          <BotaoTema />
          <button
            type="button"
            onClick={() => void sair()}
            title="Sair"
            className="flex h-11 w-full items-center justify-center gap-3 rounded-controle px-0 text-[0.9375rem] font-medium text-texto-2 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none xl:justify-start"
          >
            <span className="flex size-9 shrink-0 items-center justify-center">
              <Icone nome="sair" tamanho={20} />
            </span>
            <span className="sr-only xl:not-sr-only">Sair</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
