"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CartaoPost } from "@/components/posts/CartaoPost";
import { FormNovoPost } from "@/components/posts/FormNovoPost";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Revelar } from "@/components/ui/Revelar";
import { listarFeed, type ItemFeed, type Post } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 10;

export default function FeedPage() {
  const [itens, setItens] = useState<ItemFeed[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [logado, setLogado] = useState(true);

  const buscar = useCallback(async (offset: number) => {
    try {
      const pagina = await listarFeed(offset, POR_PAGINA);
      setItens((atuais) => {
        if (offset === 0) return pagina.items;
        const ids = new Set(atuais.map((i) => i.id));
        return [...atuais, ...pagina.items.filter((i) => !ids.has(i.id))];
      });
      setTotal(pagina.total);
      setErro(false);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  }, []);

  useEffect(() => {
    if (!meuId()) {
      setLogado(false);
      setCarregando(false);
      return;
    }
    void buscar(0);
  }, [buscar]);

  function carregarMais() {
    setCarregandoMais(true);
    void buscar(itens.length);
  }

  function tentarDeNovo() {
    setCarregando(true);
    void buscar(0);
  }

  function aoPublicar(post: Post) {
    setItens((atuais) => [{ ...post, motivo: "seguindo" }, ...atuais.filter((i) => i.id !== post.id)]);
    setTotal((t) => t + 1);
    if (erro && itens.length === 0) setErro(false);
  }

  function aoApagar(id: number) {
    setItens((atuais) => atuais.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  let conteudo: ReactNode;
  if (!logado) {
    conteudo = (
      <p className="text-sm leading-relaxed text-texto-2">
        Entre na sua conta para ver o feed.{" "}
        <Link className="font-medium text-marca-forte underline" href="/login">
          Entrar
        </Link>
      </p>
    );
  } else if (carregando) {
    conteudo = (
      <div className="space-y-4" aria-label="Carregando o feed">
        {[0, 1, 2].map((n) => (
          <div
            key={n}
            className="h-40 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none"
          />
        ))}
      </div>
    );
  } else if (erro && itens.length === 0) {
    conteudo = (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-texto-2">
          Não consegui carregar o feed. Confira se o backend está rodando e tente de novo.
        </p>
        <Botao variante="secundario" tamanho="sm" onClick={tentarDeNovo}>
          Tentar de novo
        </Botao>
      </div>
    );
  } else if (itens.length === 0) {
    conteudo = (
      <div className="space-y-3 rounded-cartao border border-dashed border-linha-forte p-6 text-center">
        <p className="text-sm leading-relaxed text-texto-2">
          Seu feed ainda está vazio. Siga quem estuda o mesmo que você ou veja quem pode te ensinar.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <BotaoLink href="/usuarios" variante="secundario" tamanho="sm">
            Encontrar pessoas
          </BotaoLink>
          <BotaoLink href="/matches" variante="fantasma" tamanho="sm">
            Ver meus matches
          </BotaoLink>
        </div>
      </div>
    );
  } else {
    conteudo = (
      <>
        <ul className="space-y-4">
          {itens.map((item, i) => (
            <li key={item.id}>
              <Revelar atraso={Math.min(i, 6) * 40}>
                <CartaoPost post={item} podeEnsinar={item.motivo === "pode_te_ensinar"} aoApagar={aoApagar} />
              </Revelar>
            </li>
          ))}
        </ul>
        {erro && (
          <p className="text-center text-sm text-texto-2">
            Não consegui carregar mais posts. Tente de novo.
          </p>
        )}
        {itens.length < total && (
          <div className="flex justify-center">
            <Botao variante="secundario" carregando={carregandoMais} onClick={carregarMais}>
              Carregar mais
            </Botao>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Feed
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          O que quem você segue e quem pode te ensinar estudou por aí.
        </p>
      </header>
      {logado && !carregando && <FormNovoPost aoPublicar={aoPublicar} />}
      {conteudo}
    </div>
  );
}
