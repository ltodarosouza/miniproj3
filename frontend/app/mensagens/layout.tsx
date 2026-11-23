"use client";

import { usePathname } from "next/navigation";

import { ListaConversas } from "@/components/mensagens/ListaConversas";
import { useNaoLidas, useTituloMensagens } from "@/lib/mensagens";

export default function MensagensLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const naoLidas = useNaoLidas();
  useTituloMensagens(naoLidas?.total ?? null);
  const caminho = usePathname();
  const segmento = caminho.split("/").filter(Boolean)[1];
  let ativa: string | undefined;
  try {
    ativa = segmento ? decodeURIComponent(segmento) : undefined;
  } catch {
    ativa = segmento;
  }

  return (
    <div className="h-[calc(100dvh-var(--altura-navegacao)-var(--altura-barra-inferior)-3.5rem)] lg:h-[calc(100dvh-5rem)] min-h-[28rem] overflow-hidden rounded-cartao border border-linha bg-superficie shadow-cartao">
      <div className="flex h-full min-h-0">
        <aside className={`${ativa ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-linha md:w-80`}>
          <ListaConversas ativa={ativa} naoLidas={naoLidas} />
        </aside>
        <section className={`${ativa ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
          {children}
        </section>
      </div>
    </div>
  );
}
