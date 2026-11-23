"use client";

import { useCallback, useEffect, useState } from "react";

import { ItemNotificacao } from "@/components/notificacoes/ItemNotificacao";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { ErroApi } from "@/lib/api";
import {
  grupoDaData,
  listarNotificacoes,
  marcarLidas,
  type GrupoData,
  type Notificacao,
} from "@/lib/notificacoes";
import { limparSessao, meuId } from "@/lib/sessao";

const ORDEM_GRUPOS: GrupoData[] = ["Hoje", "Esta semana", "Antes"];

export default function Pagina() {
  const [dados, setDados] = useState<Notificacao[] | null>(null);
  const [total, setTotal] = useState(0);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const resposta = await listarNotificacoes(0, 50);
      setDados(resposta.items);
      setTotal(resposta.total);
      await marcarLidas().catch(() => {});
    } catch (err) {
      if (err instanceof ErroApi && err.status === 401) {
        limparSessao();
        setLogado(false);
        return;
      }
      setErro(
        err instanceof ErroApi
          ? err.message
          : "sem conexão com o servidor, tente de novo",
      );
    }
  }, []);

  const carregarMais = useCallback(async () => {
    if (!dados || carregandoMais) return;
    setCarregandoMais(true);
    setErroMais(false);
    try {
      const resposta = await listarNotificacoes(dados.length, 50);
      setDados((atuais) => {
        if (!atuais) return resposta.items;
        const chaves = new Set(
          atuais.map((item) => `${item.tipo}-${item.em}-${item.ator.id}`),
        );
        return [
          ...atuais,
          ...resposta.items.filter((item) => {
            const chave = `${item.tipo}-${item.em}-${item.ator.id}`;
            if (chaves.has(chave)) return false;
            chaves.add(chave);
            return true;
          }),
        ];
      });
      setTotal(resposta.total);
    } catch {
      setErroMais(true);
    } finally {
      setCarregandoMais(false);
    }
  }, [dados, carregandoMais]);

  useEffect(() => {
    const temSessao = meuId() !== null;
    setLogado(temSessao);
    if (temSessao) carregar();
  }, [carregar]);

  const grupos = dados
    ? ORDEM_GRUPOS.map((titulo) => ({
        titulo,
        itens: dados.filter((item) => grupoDaData(item.em) === titulo),
      })).filter((grupo) => grupo.itens.length > 0)
    : [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Notificações
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Curtidas, comentários, seguidores e trocas.
        </p>
      </header>

      {logado === false && (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para ver suas notificações.{" "}
          <BotaoLink href="/login" variante="secundario" tamanho="sm">
            Entrar
          </BotaoLink>
        </p>
      )}

      {logado && erro && (
        <Cartao className="flex items-center justify-between gap-3 p-3">
          <p role="alert" className="text-sm text-texto-2">
            {erro}
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={carregar}>
            Tentar de novo
          </Botao>
        </Cartao>
      )}

      {logado && !dados && !erro && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Carregando notificações</span>
          <ul className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-16 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none"
              />
            ))}
          </ul>
        </div>
      )}

      {logado && dados && dados.length === 0 && (
        <Cartao className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-texto-2">
            Quando alguém curtir, comentar ou propor uma troca, aparece aqui.
          </p>
          <BotaoLink
            href="/feed"
            variante="secundario"
            className="shrink-0"
          >
            Ir para o feed
          </BotaoLink>
        </Cartao>
      )}

      {logado && dados && grupos.length > 0 && (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.titulo} className="space-y-3">
              <h2 className="text-sm font-semibold text-texto-2">
                {grupo.titulo}
              </h2>
              <ul className="space-y-1">
                {grupo.itens.map((item) => (
                  <li
                    key={`${item.tipo}-${item.em}-${item.ator.id}`}
                  >
                    <ItemNotificacao notificacao={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {logado && dados && dados.length < total && (
        <div className="flex flex-col items-center gap-2">
          {erroMais && (
            <p role="alert" className="text-sm text-perigo">
              não consegui carregar mais, tente de novo
            </p>
          )}
          <Botao variante="secundario" carregando={carregandoMais} onClick={carregarMais}>
            Carregar mais
          </Botao>
        </div>
      )}
    </div>
  );
}
