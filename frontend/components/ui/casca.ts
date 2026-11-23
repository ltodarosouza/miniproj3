"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { logout } from "@/lib/api";
import { limparSessao, temToken } from "@/lib/sessao";

import type { NomeIcone } from "./Icone";

export type ItemNavegacao = { href: string; rotulo: string; icone: NomeIcone };

export const HREF_PUBLICAR = "/feed?publicar=1";

export const ITENS_LATERAL: ItemNavegacao[] = [
  { href: "/feed", rotulo: "Feed", icone: "feed" },
  { href: "/busca", rotulo: "Buscar", icone: "busca" },
  { href: "/matches", rotulo: "Matches", icone: "troca" },
  { href: "/mensagens", rotulo: "Mensagens", icone: "mensagem" },
  { href: "/notificacoes", rotulo: "Notificações", icone: "sino" },
  { href: "/perfil/eu", rotulo: "Perfil", icone: "perfil" },
];

export const ITENS_BARRA_INFERIOR: ItemNavegacao[] = [
  { href: "/feed", rotulo: "Feed", icone: "feed" },
  { href: "/busca", rotulo: "Buscar", icone: "busca" },
  { href: "/matches", rotulo: "Matches", icone: "troca" },
  { href: "/perfil/eu", rotulo: "Perfil", icone: "perfil" },
];

export function rotaAtiva(caminho: string, href: string): boolean {
  if (href === "/feed") return caminho === "/feed" || caminho.startsWith("/posts");
  if (href === "/perfil/eu") return caminho.startsWith("/perfil");
  return caminho === href || caminho.startsWith(`${href}/`);
}

export function useLogado(): boolean | null {
  const caminho = usePathname();
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    setLogado(temToken());
  }, [caminho]);

  return logado;
}

export function useSair(): () => Promise<void> {
  const router = useRouter();

  return async () => {
    try {
      await logout();
    } catch {}
    limparSessao();
    router.replace("/login");
    router.refresh();
  };
}
