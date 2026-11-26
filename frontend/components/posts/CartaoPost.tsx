"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EditorPost } from "@/components/posts/EditorPost";
import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoCurtir } from "@/components/ui/BotaoCurtir";
import { Icone } from "@/components/ui/Icone";
import { ToqueDuplo } from "@/components/ui/ToqueDuplo";
import { formatarDataHora, formatarQuando } from "@/lib/datas";
import {
  apagarPost,
  curtirPost,
  descurtirPost,
  formatarTempoEstudado,
  urlDaImagem,
  type Post,
} from "@/lib/posts";
import { meuId } from "@/lib/sessao";

// Linha do Diário: hora na coluna da esquerda, registro à direita e régua entre um e outro.
export function CartaoPost({ post: inicial, podeEnsinar = false, rotulo, aoApagar }: { post: Post; podeEnsinar?: boolean; rotulo?: string; aoApagar?: (id: number) => void }) {
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
  // Segundo clique enquanto o primeiro ainda está no servidor é ignorado: evita contador fora de sincronia.
  const curtindo = useRef(false);
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
    if (curtindo.current) return;
    curtindo.current = true;
    const proximo = !curtido;
    setCurtido(proximo);
    setCurtidas((total) => total + (proximo ? 1 : -1));
    try {
      await (proximo ? curtirPost(post.id) : descurtirPost(post.id));
    } catch {
      setCurtido(!proximo);
      setCurtidas((total) => total + (proximo ? -1 : 1));
    } finally {
      curtindo.current = false;
    }
  }

  const marcacao = rotulo ?? (podeEnsinar ? "Pode te ensinar" : null);

  return (
    <ToqueDuplo desativado={editando} aoToqueDuplo={() => { if (!curtido) void alternarCurtida(); }}>
      <article className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-4">
        <time
          className={`pt-1.5 font-mono text-xs text-texto-3 numeros ${marcacao ? "mt-6" : ""}`}
          dateTime={post.created_at}
          title={formatarDataHora(post.created_at)}
        >
          {formatarQuando(post.created_at)}
        </time>
        <div className="col-start-2 min-w-0">
          {marcacao && (
            <p className="mb-2 h-4 font-mono text-[0.6875rem] uppercase leading-4 tracking-[0.08em] text-marca-forte">
              {marcacao}
            </p>
          )}
          <header className="flex items-center gap-2.5">
            <Link href={perfil} aria-label={`Perfil de ${post.autor.name}`}>
              <Avatar nome={post.autor.name} url={post.autor.avatar_url} tamanho="sm" />
            </Link>
            <p className="flex min-w-0 flex-1 items-baseline gap-2">
              <Link href={perfil} className="truncate font-medium text-texto hover:underline">
                {post.autor.name}
              </Link>
              <span className="hidden truncate font-mono text-xs text-texto-3 sm:inline">@{post.autor.username}</span>
              {post.editado_em && (
                <span className="shrink-0 font-mono text-xs text-texto-3" title={`Editado ${formatarQuando(post.editado_em)}`}>
                  · editado
                </span>
              )}
            </p>
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
              <p className="mt-2.5 max-w-[65ch] whitespace-pre-line break-words text-[0.9375rem] leading-relaxed text-texto">
                {post.texto}
              </p>

              {(post.minutos_estudados !== null || post.habilidade) && (
                <p className="mt-2.5 flex flex-wrap items-center gap-2 font-mono text-xs text-texto-2 numeros">
                  {post.minutos_estudados !== null && <span>{formatarTempoEstudado(post.minutos_estudados)}</span>}
                  {post.minutos_estudados !== null && post.habilidade && <span aria-hidden="true">·</span>}
                  {post.habilidade && (
                    <span className="rounded-controle border border-linha px-1.5 py-0.5 text-texto">{post.habilidade.nome}</span>
                  )}
                </p>
              )}

              {post.imagem_url && !imagemFalhou && (
                <img
                  src={urlDaImagem(post.imagem_url)}
                  alt="Foto do post"
                  loading="lazy"
                  onError={() => setImagemFalhou(true)}
                  className="mt-3 max-h-[28rem] w-full rounded-controle object-cover ring-1 ring-linha"
                />
              )}
            </>
          )}

          <footer ref={rodape} data-sem-toque-duplo className="mt-2 -ml-2 flex flex-wrap items-center gap-1">
            <BotaoCurtir curtido={curtido} total={curtidas} aoAlternar={alternarCurtida} />
            <Link
              href={`/posts/${post.id}#comentarios`}
              aria-label={`Comentários (${post.comentarios})`}
              className="inline-flex h-8 items-center gap-1.5 rounded-controle px-2 text-sm text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
            >
              <Icone nome="comentario" tamanho={16} />
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
                  className="inline-flex size-8 items-center justify-center rounded-controle text-texto-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 hover:text-texto motion-reduce:transition-none"
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
        </div>
      </article>
    </ToqueDuplo>
  );
}
