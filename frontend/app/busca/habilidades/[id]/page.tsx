"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CartaoPost } from "@/components/posts/CartaoPost";
import { Avatar } from "@/components/ui/Avatar";
import { Icone } from "@/components/ui/Icone";
import { ErroApi, type User } from "@/lib/api";
import { detalharHabilidade, type DetalheHabilidade } from "@/lib/busca";

function Pessoas({ titulo, pessoas, vazio }: { titulo: string; pessoas: User[]; vazio: string }) {
  return (
    <section className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
      <h2 className="mb-3 text-sm font-semibold text-texto">
        {titulo} <span className="numeros font-normal text-texto-3">({pessoas.length})</span>
      </h2>
      {pessoas.length === 0 ? (
        <p className="text-sm text-texto-3">{vazio}</p>
      ) : (
        <ul className="space-y-3">
          {pessoas.map((p) => (
            <li key={p.id}>
              <Link href={`/perfil/${encodeURIComponent(p.username)}`} className="flex min-w-0 items-center gap-3 hover:underline">
                <Avatar nome={p.name} url={p.avatar_url} tamanho="sm" />
                <span className="min-w-0 truncate text-sm text-texto">{p.name}</span>
                <span className="min-w-0 shrink-[2] truncate text-xs text-texto-3">@{p.username}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PaginaHabilidade() {
  const parametros = useParams<{ id: string }>();
  const id = /^\d+$/.test(parametros.id) ? Number(parametros.id) : 0;
  const [detalhe, setDetalhe] = useState<DetalheHabilidade | null>(null);
  const [erro, setErro] = useState<"" | "nao-existe" | "falhou">("");

  useEffect(() => {
    let ativo = true;
    setDetalhe(null);
    setErro("");
    detalharHabilidade(id)
      .then((d) => ativo && setDetalhe(d))
      .catch((falha) => ativo && setErro(falha instanceof ErroApi && falha.status === 404 ? "nao-existe" : "falhou"));
    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link href="/busca" className="inline-flex items-center gap-1.5 text-sm text-texto-2 hover:text-texto">
        <Icone nome="voltar" tamanho={16} />
        Buscar
      </Link>
      {erro ? (
        <p className="text-sm text-texto-2">
          {erro === "nao-existe" ? "Não achei essa habilidade." : "Não deu para carregar agora. Tente de novo."}
        </p>
      ) : !detalhe ? (
        <p className="text-sm text-texto-3" role="status">
          Carregando…
        </p>
      ) : (
        <>
          <header>
            <h1 className="break-words text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">{detalhe.habilidade.nome}</h1>
            <p className="mt-1 text-sm text-texto-2">
              {detalhe.habilidade.categoria === "tech" ? "Tecnologia" : "Disciplina"}
            </p>
          </header>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Pessoas titulo="Quem sabe" pessoas={detalhe.sabem} vazio="Ninguém marcou que sabe ainda." />
            <Pessoas titulo="Quem quer aprender" pessoas={detalhe.querem} vazio="Ninguém marcou que quer aprender ainda." />
          </div>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-texto">Publicações</h2>
            {detalhe.posts.length === 0 ? (
              <p className="text-sm text-texto-3">Ninguém publicou sobre {detalhe.habilidade.nome} ainda.</p>
            ) : (
              <ul className="space-y-4">
                {detalhe.posts.map((post) => (
                  <li key={post.id}>
                    <CartaoPost
                      post={post}
                      aoApagar={(apagado) =>
                        setDetalhe((atual) => atual && { ...atual, posts: atual.posts.filter((p) => p.id !== apagado) })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
