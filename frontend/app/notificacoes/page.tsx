"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ItemNotificacao } from "@/components/notificacoes/ItemNotificacao";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { ErroApi } from "@/lib/api";
import {
  grupoDaData,
  chaveDaNotificacao,
  listarPaginaNotificacoes,
  marcarLidas,
  type GrupoData,
  type Notificacao,
} from "@/lib/notificacoes";
import { limparSessao, meuId } from "@/lib/sessao";

const ORDEM_GRUPOS: GrupoData[] = ["Hoje", "Esta semana", "Antes"];

export default function Pagina() {
  const [dados, setDados] = useState<Notificacao[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);
  const montada = useRef(false);
  const carregandoMaisRef = useRef(false);

  const carregar = useCallback(async () => {
    const id = meuId();
    setErro(null);
    try {
      const resposta = await listarPaginaNotificacoes(50);
      if (!montada.current || meuId() !== id) return;
      setDados(resposta.items);
      setCursor(resposta.proximo_cursor);
      await marcarLidas().catch(() => {});
    } catch (err) {
      if (!montada.current || meuId() !== id) return;
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
    if (!dados?.length || cursor === null || carregandoMaisRef.current) return;
    const id = meuId();
    carregandoMaisRef.current = true;
    setCarregandoMais(true);
    setErroMais(false);
    try {
      const resposta = await listarPaginaNotificacoes(50, cursor);
      if (!montada.current || meuId() !== id) return;
      setDados((anteriores) => anteriores ? [...anteriores, ...resposta.items] : resposta.items);
      setCursor(resposta.proximo_cursor);
    } catch {
      if (montada.current && meuId() === id) setErroMais(true);
    } finally {
      carregandoMaisRef.current = false;
      if (montada.current && meuId() === id) setCarregandoMais(false);
    }
  }, [dados, cursor]);

  useEffect(() => {
    montada.current = true;
    const temSessao = meuId() !== null;
    setLogado(temSessao);
    if (temSessao) carregar();
    return () => {
      montada.current = false;
    };
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
          Registro de curtidas, comentários, seguidores e trocas.
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
        <div className="flex items-center justify-between gap-3 border-y border-linha py-4">
          <p role="alert" className="text-sm text-texto-2">
            {erro}
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={carregar}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {logado && !dados && !erro && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Carregando notificações</span>
          <ul className="divide-y divide-linha border-y border-linha" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="flex h-14 animate-pulse items-center gap-3 motion-reduce:animate-none"
              >
                <span className="h-3 w-10 rounded-[2px] bg-superficie-2" />
                <span className="size-10 rounded-[4px] bg-superficie-2" />
                <span className="h-3 flex-1 rounded-[2px] bg-superficie-2" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {logado && dados && dados.length === 0 && (
        <div className="flex flex-col items-start gap-4 border-y border-linha py-4 sm:flex-row sm:items-center sm:justify-between">
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
        </div>
      )}

      {logado && dados && grupos.length > 0 && (
        <div className="space-y-8">
          {grupos.map((grupo, indice) => (
            <section key={grupo.titulo}>
              <h2 className="pb-2 border-b border-linha font-mono text-xs uppercase tracking-[0.08em] text-texto-3 tabular-nums">
                {String(indice + 1).padStart(2, "0")} · {grupo.titulo}
              </h2>
              <ul className="divide-y divide-linha border-b border-linha">
                {grupo.itens.map((item) => (
                  <li key={chaveDaNotificacao(item)}>
                    <ItemNotificacao notificacao={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {logado && dados && cursor !== null && (
        <div className="flex flex-col items-start gap-2">
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
