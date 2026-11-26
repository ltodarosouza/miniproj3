"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HREF_PUBLICAR, ITENS_BARRA_INFERIOR, rotaAtiva } from "./casca";
import { Icone } from "./Icone";

export function BarraInferior() {
  const caminho = usePathname();
  const itens = [
    ...ITENS_BARRA_INFERIOR.slice(0, 2),
    ...ITENS_BARRA_INFERIOR.slice(-2),
  ];

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-superficie pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {itens.slice(0, 2).map((item) => {
          const ativo = rotaAtiva(caminho, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex h-full items-center justify-center transition-colors duration-[var(--rapido)] ${ativo ? "text-texto before:absolute before:inset-x-4 before:top-0 before:h-[2px] before:bg-marca before:content-['']" : "text-texto-3 hover:text-texto-2"}`}
              >
                <Icone nome={item.icone} tamanho={24} />
                <span className="sr-only">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={HREF_PUBLICAR}
            aria-label="Publicar"
            className="flex h-full items-center justify-center"
          >
            <span className="flex h-9 w-12 items-center justify-center rounded-controle bg-marca text-marca-texto">
              <Icone nome="mais" tamanho={22} />
            </span>
          </Link>
        </li>
        {itens.slice(2).map((item) => {
          const ativo = rotaAtiva(caminho, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`relative flex h-full items-center justify-center transition-colors duration-[var(--rapido)] ${ativo ? "text-texto before:absolute before:inset-x-4 before:top-0 before:h-[2px] before:bg-marca before:content-['']" : "text-texto-3 hover:text-texto-2"}`}
              >
                <Icone nome={item.icone} tamanho={24} />
                <span className="sr-only">{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
