"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { eu } from "@/lib/api";
import { buscarPerfil, listarPostsDoUsuario } from "@/lib/perfil";
import { meuId } from "@/lib/sessao";

export type InfoStreak = { dias: number; postouHoje: boolean } | null;

export function useStreak(): InfoStreak {
  const caminho = usePathname();
  const id = meuId();
  const usuarioRef = useRef<{ id: number; username: string } | null>(null);
  const [info, setInfo] = useState<InfoStreak>(null);

  useEffect(() => {
    let ativo = true;
    let intervalo: ReturnType<typeof setInterval> | undefined;

    if (id === null) {
      usuarioRef.current = null;
      setInfo(null);
      return () => {
        ativo = false;
      };
    }

    if (usuarioRef.current?.id !== id) usuarioRef.current = null;

    const atualizar = async () => {
      try {
        if (usuarioRef.current === null) {
          const usuario = await eu();
          if (!ativo) return;
          usuarioRef.current = { id, username: usuario.username };
        }

        const username = usuarioRef.current.username;
        const [perfil, posts] = await Promise.all([
          buscarPerfil(username),
          listarPostsDoUsuario(username, 0, 1),
        ]);
        if (!ativo) return;

        const hoje = new Date().toISOString().slice(0, 10);
        const criadoEm = posts.items[0]?.created_at;
        setInfo({
          dias: perfil.streak,
          postouHoje: Boolean(criadoEm && new Date(criadoEm).toISOString().slice(0, 10) === hoje),
        });
      } catch {}
    };

    void atualizar();
    intervalo = setInterval(() => {
      if (document.visibilityState === "visible") void atualizar();
    }, 60_000);

    return () => {
      ativo = false;
      if (intervalo) clearInterval(intervalo);
    };
  }, [caminho, id]);

  return info;
}
