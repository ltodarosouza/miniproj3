"use client";

import { usePathname } from "next/navigation";

import { ListaConversas } from "@/components/mensagens/ListaConversas";

export default function MensagensLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const caminho = usePathname();
  const segmento = caminho.split("/").filter(Boolean)[1];
  let ativa: string | undefined;
  try {
    ativa = segmento ? decodeURIComponent(segmento) : undefined;
  } catch {
    ativa = segmento;
  }

  return (
    <div className="h-[calc(100dvh-3.5rem-4rem)] min-h-[28rem] overflow-hidden rounded-cartao border border-linha bg-superficie shadow-cartao">
      <div className="flex h-full min-h-0">
        <aside className={`${ativa ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-r border-linha md:w-80`}>
          <ListaConversas ativa={ativa} />
        </aside>
        <section className={`${ativa ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
          {children}
        </section>
      </div>
    </div>
  );
}
