"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CartaoPost } from "@/components/posts/CartaoPost";
import { Avatar } from "@/components/ui/Avatar";
import { Icone } from "@/components/ui/Icone";
import { ErroApi, type User } from "@/lib/api";
import { detalharHabilidade, type DetalheHabilidade } from "@/lib/busca";

function Pessoas({ titulo, numero, pessoas, vazio }: { titulo: string; numero: string; pessoas: User[]; vazio: string }) {
  return (
    <section className="min-w-0">
      <h2 className="text-[0.8125rem] font-semibold text-texto-2">
        {numero} · {titulo} <span className="font-mono numeros text-texto-3">({pessoas.length})</span>
      </h2>
      {pessoas.length === 0 ? (
        <p className="mt-3 border-y border-linha py-3 text-sm text-texto-3">{vazio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-linha border-y border-linha">
          {pessoas.map((p) => (
            <li key={p.id} className="min-w-0">
              <Link href={`/perfil/${encodeURIComponent(p.username)}`} className="flex min-w-0 items-center gap-3 px-1 py-2.5 hover:bg-superficie-2">
                <Avatar nome={p.name} url={p.avatar_url} tamanho="sm" />
                <span className="min-w-0 truncate text-sm text-texto">{p.name}</span>
                <span className="min-w-0 shrink-[2] truncate font-mono text-xs text-texto-3">@{p.username}</span>
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
            <p className="text-[0.8125rem] text-texto-2 font-semibold">
              {detalhe.habilidade.categoria === "tech" ? "Tecnologia" : "Disciplina"} · #{detalhe.habilidade.id}
            </p>
            <h1 className="mt-1 break-words font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">{detalhe.habilidade.nome}</h1>
            <dl className="mt-4 grid grid-cols-2 divide-x divide-linha border-y border-linha">
              <div className="px-3 py-3 first:pl-0">
                <dt className="text-[0.8125rem] text-texto-2 font-semibold">Sabem</dt>
                <dd className="font-mono numeros text-2xl font-semibold text-texto">{detalhe.sabem.length}</dd>
              </div>
              <div className="px-3 py-3 first:pl-0">
                <dt className="text-[0.8125rem] text-texto-2 font-semibold">Querem aprender</dt>
                <dd className="flex items-center gap-2 font-mono numeros text-2xl font-semibold text-texto">
                  {detalhe.querem.length}
                  {detalhe.querem.length > detalhe.sabem.length && (
                    <span role="img" aria-label="mais gente querendo aprender do que sabendo" className="font-sans text-sm text-marca-forte">▲</span>
                  )}
                </dd>
              </div>
            </dl>
          </header>
          <div className="min-w-0 space-y-8 sm:grid sm:grid-cols-2 sm:gap-8 sm:space-y-0">
            <Pessoas numero="01" titulo="Quem sabe" pessoas={detalhe.sabem} vazio="Ninguém marcou que sabe ainda." />
            <Pessoas numero="02" titulo="Quem quer aprender" pessoas={detalhe.querem} vazio="Ninguém marcou que quer aprender ainda." />
          </div>
          <section>
            <h2 className="text-[0.8125rem] font-semibold text-texto-2"><span className="font-mono font-medium numeros">03</span> · Posts</h2>
            {detalhe.posts.length === 0 ? (
              <p className="mt-3 text-sm text-texto-3">Ninguém publicou sobre {detalhe.habilidade.nome} ainda.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linha border-y border-linha">
                {detalhe.posts.map((post) => (
                  <li key={post.id} className="py-4">
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
