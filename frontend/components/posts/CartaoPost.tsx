"use client";

import Link from "next/link";
import { useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { formatarQuando } from "@/lib/datas";
import {
  curtirPost,
  descurtirPost,
  formatarTempoEstudado,
  urlDaImagem,
  type Post,
} from "@/lib/posts";

export function CartaoPost({ post, podeEnsinar = false }: { post: Post; podeEnsinar?: boolean }) {
  const [curtido, setCurtido] = useState(post.curtido);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const perfil = `/perfil/${encodeURIComponent(post.autor.username)}`;

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

        <footer className="mt-3 -ml-2.5 flex items-center gap-1">
          <BotaoCurtir curtido={curtido} total={curtidas} aoAlternar={alternarCurtida} />
          <Link
            href={`/posts/${post.id}`}
            aria-label="Ver comentários"
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto"
          >
            <Icone nome="comentario" tamanho={18} />
            <span className="numeros">{post.comentarios}</span>
          </Link>
        </footer>
      </article>
    </Cartao>
  );
}
