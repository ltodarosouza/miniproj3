"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { Botao } from "@/components/ui/Botao";
import { formatarQuando } from "@/lib/datas";
import {
  curtirPost,
  descurtirPost,
  apagarPost,
  formatarTempoEstudado,
  urlDaImagem,
  type Post,
} from "@/lib/posts";
import { meuId } from "@/lib/sessao";

export function CartaoPost({ post, podeEnsinar = false, aoApagar }: { post: Post; podeEnsinar?: boolean; aoApagar?: (id: number) => void }) {
  const [curtido, setCurtido] = useState(post.curtido);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [souAutor, setSouAutor] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [apagado, setApagado] = useState(false);
  const [erroApagar, setErroApagar] = useState(false);
  const rodape = useRef<HTMLElement>(null);
  const perfil = `/perfil/${encodeURIComponent(post.autor.username)}`;

  useEffect(() => setSouAutor(meuId() === post.autor.id), [post.autor.id]);

  useEffect(() => {
    if (!confirmando) return;
    rodape.current?.querySelector<HTMLButtonElement>("[data-cancelar]")?.focus();
    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setConfirmando(false);
    }
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, [confirmando]);

  if (apagado) return null;

  async function alternarCurtida() {
    const proximo = !curtido;
    setCurtido(proximo);
    setCurtidas((total) => total + (proximo ? 1 : -1));
    try {
      await (proximo ? curtirPost(post.id) : descurtirPost(post.id));
    } catch {
      setCurtido(!proximo);
      setCurtidas((total) => total + (proximo ? -1 : 1));
    }
  }

  return (
    <Cartao interativo className="p-5">
      <article>
        <header className="flex items-center gap-3">
          <Link href={perfil} aria-label={`Perfil de ${post.autor.name}`}>
            <Avatar nome={post.autor.name} url={post.autor.avatar_url} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={perfil} className="block truncate font-medium text-texto hover:underline">
              {post.autor.name}
            </Link>
            <p className="truncate text-sm text-texto-3">
              @{post.autor.username} ·{" "}
              <time className="numeros" dateTime={post.created_at}>
                {formatarQuando(post.created_at)}
              </time>
            </p>
          </div>
          {podeEnsinar && <TagHabilidade nome="Pode te ensinar" tipo="sei" />}
        </header>

        <p className="mt-4 max-w-[65ch] whitespace-pre-line text-[0.9375rem] leading-relaxed text-texto">
          {post.texto}
        </p>

        {post.minutos_estudados !== null && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-texto-2">
            <Icone nome="relogio" tamanho={16} />
            <span className="font-mono">{formatarTempoEstudado(post.minutos_estudados)}</span>
            <span>de {post.habilidade ? post.habilidade.nome : "estudo"}</span>
          </p>
        )}
        {post.minutos_estudados === null && post.habilidade && (
          <div className="mt-3">
            <TagHabilidade nome={post.habilidade.nome} />
          </div>
        )}

        {post.imagem_url && !imagemFalhou && (
          <img
            src={urlDaImagem(post.imagem_url)}
            alt="Foto do post"
            loading="lazy"
            onError={() => setImagemFalhou(true)}
            className="mt-4 max-h-96 w-full rounded-controle object-cover ring-1 ring-linha"
          />
        )}

        <footer ref={rodape} className="mt-3 -ml-2.5 flex flex-wrap items-center gap-1">
          <BotaoCurtir curtido={curtido} total={curtidas} aoAlternar={alternarCurtida} />
          <Link
            href={`/posts/${post.id}#comentarios`}
            aria-label={`Comentários (${post.comentarios})`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
          >
            <Icone nome="comentario" tamanho={18} />
            <span className="numeros">{post.comentarios}</span>
          </Link>
          {souAutor && !confirmando && (
            <button type="button" aria-label="Apagar post" onClick={() => { setErroApagar(false); setConfirmando(true); }} className="ml-auto inline-flex size-8 items-center justify-center rounded-full text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-perigo motion-reduce:transition-none">
              <Icone nome="lixeira" tamanho={17} />
            </button>
          )}
          {souAutor && confirmando && (
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <span className="mr-1 text-sm text-texto-2">Apagar este post?</span>
              <Botao data-cancelar type="button" variante="fantasma" tamanho="sm" disabled={apagando} onClick={() => setConfirmando(false)}>Cancelar</Botao>
              <button type="button" disabled={apagando} onClick={async () => {
                setApagando(true);
                setErroApagar(false);
                try {
                  await apagarPost(post.id);
                  setApagado(true);
                  aoApagar?.(post.id);
                } catch {
                  setErroApagar(true);
                  setConfirmando(false);
                } finally {
                  setApagando(false);
                }
              }} className="h-8 rounded-controle px-3 text-sm font-medium text-perigo transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50">{apagando ? "Apagando..." : "Apagar"}</button>
            </div>
          )}
          {erroApagar && <p role="alert" className="w-full text-sm text-perigo">Não deu para apagar. Tente de novo.</p>}
        </footer>
      </article>
    </Cartao>
  );
}
