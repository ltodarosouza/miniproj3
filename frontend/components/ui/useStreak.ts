"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { eu } from "@/lib/api";
import { dataLocal } from "@/lib/datas";
import { buscarPerfil, listarPostsDoUsuario } from "@/lib/perfil";
import { EVENTO_POSTS_MUDARAM } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

export type InfoStreak = { dias: number; postouHoje: boolean } | null;

export function useStreak(): InfoStreak {
  const caminho = usePathname();
  const id = meuId();
  const usuarioRef = useRef<{ id: number; username: string } | null>(null);
  const atualizacaoRef = useRef(0);
  const [info, setInfo] = useState<InfoStreak>(null);

  useEffect(() => {
    let ativo = true;
    let intervalo: ReturnType<typeof setInterval> | undefined;

    const atualizar = async () => {
      const atualizacao = ++atualizacaoRef.current;
      try {
        if (usuarioRef.current === null) {
          const usuario = await eu();
          if (!ativo || atualizacao !== atualizacaoRef.current) return;
          usuarioRef.current = { id: id!, username: usuario.username };
        }

        const username = usuarioRef.current.username;
        const [perfil, posts] = await Promise.all([
          buscarPerfil(username),
          listarPostsDoUsuario(username, 0, 1),
        ]);
        if (!ativo || atualizacao !== atualizacaoRef.current) return;

        const criadoEm = posts.items[0]?.created_at;
        setInfo({
          dias: perfil.streak,
          postouHoje: criadoEm !== undefined && dataLocal(new Date(criadoEm)) === dataLocal(new Date()),
        });
      } catch {}
    };

    if (id === null) {
      usuarioRef.current = null;
      atualizacaoRef.current += 1;
      setInfo(null);
      return () => {
        ativo = false;
      };
    }

    if (usuarioRef.current?.id !== id) usuarioRef.current = null;

    const aoMudarPosts = () => void atualizar();
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") void atualizar();
    };

    void atualizar();
    window.addEventListener(EVENTO_POSTS_MUDARAM, aoMudarPosts);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    intervalo = setInterval(() => {
      if (document.visibilityState === "visible") void atualizar();
    }, 60_000);

    return () => {
      ativo = false;
      atualizacaoRef.current += 1;
      window.removeEventListener(EVENTO_POSTS_MUDARAM, aoMudarPosts);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      if (intervalo) clearInterval(intervalo);
    };
  }, [caminho, id]);

  return info;
}
