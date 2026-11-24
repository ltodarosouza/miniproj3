"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EditorPost } from "@/components/posts/EditorPost";
import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ToqueDuplo } from "@/components/ui/ToqueDuplo";
import { formatarQuando } from "@/lib/datas";
import {
  apagarPost,
  curtirPost,
  descurtirPost,
  formatarTempoEstudado,
  urlDaImagem,
  type Post,
} from "@/lib/posts";
import { meuId } from "@/lib/sessao";

export function CartaoPost({ post: inicial, podeEnsinar = false, aoApagar }: { post: Post; podeEnsinar?: boolean; aoApagar?: (id: number) => void }) {
  const [post, setPost] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const [curtido, setCurtido] = useState(post.curtido);
  const [curtidas, setCurtidas] = useState(post.curtidas);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [souAutor, setSouAutor] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [apagado, setApagado] = useState(false);
  const [erroApagar, setErroApagar] = useState(false);
  const rodape = useRef<HTMLElement>(null);
  const jaConfirmou = useRef(false);
  const perfil = `/perfil/${encodeURIComponent(post.autor.username)}`;

  useEffect(() => {
    setPost(inicial);
    setCurtido(inicial.curtido);
    setCurtidas(inicial.curtidas);
  }, [inicial]);

  useEffect(() => setSouAutor(meuId() === post.autor.id), [post.autor.id]);

  useEffect(() => {
    if (!confirmando) {
      if (jaConfirmou.current) rodape.current?.querySelector<HTMLButtonElement>("[data-apagar]")?.focus();
      return;
    }
    jaConfirmou.current = true;
    rodape.current?.querySelector<HTMLButtonElement>("[data-cancelar]")?.focus();
    function aoPressionar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setConfirmando(false);
    }
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, [confirmando]);

  useEffect(() => {
    if (!menuAberto) return;
    menu.current?.querySelector<HTMLButtonElement>("[data-item-menu]")?.focus();
    function fora(evento: MouseEvent) {
      if (!menu.current?.contains(evento.target as Node)) setMenuAberto(false);
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setMenuAberto(false);
        menu.current?.querySelector<HTMLButtonElement>("[data-apagar]")?.focus();
      }
    }
    document.addEventListener("mousedown", fora);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("keydown", tecla);
    };
  }, [menuAberto]);

  function fecharEditor() {
    setEditando(false);
    requestAnimationFrame(() => rodape.current?.querySelector<HTMLButtonElement>("[data-apagar]")?.focus());
  }

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
    <ToqueDuplo desativado={editando} aoToqueDuplo={() => { if (!curtido) void alternarCurtida(); }}>
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
              {post.editado_em && (
                <span title={`Editado ${formatarQuando(post.editado_em)}`}> · editado</span>
              )}
            </p>
          </div>
          {podeEnsinar && <TagHabilidade nome="Pode te ensinar" tipo="sei" />}
        </header>

        {editando ? (
          <EditorPost
            post={post}
            aoCancelar={fecharEditor}
            aoSalvar={(salvo) => {
              setPost(salvo);
              fecharEditor();
            }}
          />
        ) : (
        <>
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
        </>
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
          {souAutor && !confirmando && !editando && (
            <div
              ref={menu}
              className="relative ml-auto"
              onBlur={(evento) => {
                if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setMenuAberto(false);
              }}
            >
              <button
                data-apagar
                type="button"
                aria-label="Mais opções do post"
                aria-controls={`menu-post-${post.id}`}
                aria-expanded={menuAberto}
                onClick={() => setMenuAberto((aberto) => !aberto)}
                className="inline-flex size-8 items-center justify-center rounded-full text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
              >
                <Icone nome="opcoes" tamanho={18} />
              </button>
              {menuAberto && (
                <div id={`menu-post-${post.id}`} className="absolute bottom-full right-0 z-10 mb-1 min-w-36 rounded-controle border border-linha bg-superficie p-1 shadow-alta">
                  <button
                    type="button"
                    data-item-menu
                    onClick={() => {
                      setMenuAberto(false);
                      setEditando(true);
                    }}
                    className="flex w-full items-center rounded-controle px-3 py-2 text-left text-sm text-texto hover:bg-superficie-2 focus-visible:bg-superficie-2"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    data-item-menu
                    onClick={() => {
                      setMenuAberto(false);
                      setErroApagar(false);
                      setConfirmando(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-controle px-3 py-2 text-left text-sm text-perigo hover:bg-superficie-2 focus-visible:bg-superficie-2"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                    Apagar
                  </button>
                </div>
              )}
            </div>
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
                  const item = rodape.current?.closest("li");
                  const vizinho = item?.nextElementSibling ?? item?.previousElementSibling;
                  vizinho?.querySelector<HTMLElement>("a, button")?.focus();
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
    </ToqueDuplo>
  );
}
