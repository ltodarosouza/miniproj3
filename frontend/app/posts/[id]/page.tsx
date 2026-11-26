"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CaixaComentario } from "@/components/posts/CaixaComentario";
import { CartaoPost } from "@/components/posts/CartaoPost";
import { ListaComentarios } from "@/components/posts/ListaComentarios";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { ErroApi } from "@/lib/api";
import { buscarPost, comentar, listarComentarios, type Comentario, type Post } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

export default function PaginaPost() {
  const parametros = useParams<{ id: string }>();
  const roteador = useRouter();
  const id = /^\d+$/.test(parametros.id) ? Number(parametros.id) : 0;
  const [post, setPost] = useState<Post | null>(null);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [totalComentarios, setTotalComentarios] = useState(0);
  const idAtual = useRef(id);
  idAtual.current = id;
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<unknown>(null);
  const [logado, setLogado] = useState(true);

  const buscar = useCallback(async (ativo: () => boolean = () => true) => {
    if (id < 1 || !Number.isSafeInteger(id)) {
      setErro(new ErroApi("Esse post não existe mais.", 404));
      setCarregando(false);
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const [postEncontrado, paginaComentarios] = await Promise.all([
        buscarPost(id),
        listarComentarios(id),
      ]);
      if (!ativo()) return;
      setPost(postEncontrado);
      setComentarios(paginaComentarios.items);
      setTotalComentarios(paginaComentarios.total);
    } catch (falha) {
      if (!ativo()) return;
      setErro(falha);
    } finally {
      if (ativo()) setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    let ativo = true;
    if (!meuId()) {
      setLogado(false);
      setCarregando(false);
      return () => {
        ativo = false;
      };
    }
    setLogado(true);
    void buscar(() => ativo);
    return () => {
      ativo = false;
    };
  }, [buscar]);

  async function comentarioNovo(texto: string) {
    const idDoPost = id;
    const novo = await comentar(idDoPost, texto);
    if (idAtual.current !== idDoPost) return;
    setComentarios((atuais) => atuais.some((comentario) => comentario.id === novo.id) ? atuais : [...atuais, novo]);
    setTotalComentarios((total) => total + 1);
    setPost((atual) => atual && { ...atual, comentarios: atual.comentarios + 1 });
  }

  const voltar = (
    <Link
      href="/feed"
      className="inline-flex items-center gap-1.5 text-sm text-texto-2 transition-colors duration-[var(--rapido)] hover:text-texto motion-reduce:transition-none"
    >
      <Icone nome="voltar" tamanho={16} />
      Voltar à Mesa
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {voltar}
      {!logado ? (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para ver este post.{" "}
          <Link className="font-medium text-marca-forte underline" href="/login">
            Entrar
          </Link>
        </p>
      ) : carregando ? (
        <div className="space-y-4" aria-label="Carregando o post">
          <div className="h-40 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
          <div className="h-24 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
        </div>
      ) : erro instanceof ErroApi && erro.status === 404 ? (
        <p className="text-sm leading-relaxed text-texto-2">
          Esse post não existe mais. Ele pode ter sido apagado por quem publicou.
        </p>
      ) : erro ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm leading-relaxed text-texto-2">
            Não consegui carregar este post. Confira se o backend está rodando e tente de novo.
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={() => void buscar()}>
            Tentar de novo
          </Botao>
        </div>
      ) : post ? (
        <>
          <div className="border-t border-linha"><CartaoPost key={post.id} post={post} aoApagar={() => roteador.replace("/feed")} /></div>
          <section id="comentarios" aria-labelledby="titulo-comentarios">
            <div className="space-y-5 border-t border-linha pt-4">
              <h2 id="titulo-comentarios" className="text-[0.8125rem] text-texto-2 font-semibold">
                Comentários <span className="font-mono font-medium numeros text-texto-2">{totalComentarios}</span>
              </h2>
              <ListaComentarios comentarios={comentarios} />
              <div className="border-t border-linha pt-5">
                <CaixaComentario aoComentar={comentarioNovo} />
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
