"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CartaoPost } from "@/components/posts/CartaoPost";
import { Botao } from "@/components/ui/Botao";
import { Revelar } from "@/components/ui/Revelar";
import { listarFeed, type ItemFeed } from "@/lib/posts";
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
      setItens((atuais) => (offset === 0 ? pagina.items : [...atuais, ...pagina.items]));
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
      <div className="space-y-2">
        <p className="text-sm text-texto-2">
          Seu feed está vazio. Siga pessoas para ver o que elas estudam.
        </p>
        <Link className="text-sm font-medium text-marca-forte underline" href="/usuarios">
          Encontrar pessoas
        </Link>
      </div>
    );
  } else {
    conteudo = (
      <>
        <ul className="space-y-4">
          {itens.map((item, i) => (
            <li key={item.id}>
              <Revelar atraso={Math.min(i, 6) * 40}>
                <CartaoPost post={item} podeEnsinar={item.motivo === "pode_te_ensinar"} />
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
      {conteudo}
    </div>
  );
}
