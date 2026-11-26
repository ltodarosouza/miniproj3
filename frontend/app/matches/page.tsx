"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, type Match } from "@/lib/api";
import { listarMatchesComAndamento, type MatchesComAndamento } from "@/lib/trocas";
import { limparSessao, meuId } from "@/lib/sessao";

const LINK_TEXTO =
  "font-medium text-marca-forte underline underline-offset-2";

function TabelaPares({
  rotulo,
  descricao,
  itens,
  troca,
  vazio,
}: {
  rotulo: string;
  descricao: string;
  itens: Match[];
  troca: boolean;
  vazio: ReactNode;
}) {
  const colunas = troca
    ? "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_6.5rem]"
    : "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_6.5rem]";
  const habilidades = "order-2 flex min-w-0 flex-wrap content-start items-center gap-1.5 sm:order-none [&>span]:min-w-0 [&>span]:max-w-full [&>span]:whitespace-normal [&>span]:[overflow-wrap:anywhere] [&>span:not([aria-hidden])]:h-auto [&>span:not([aria-hidden])]:min-h-7";
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-[0.8125rem] font-semibold text-texto-2">{rotulo}</h2>
        <p className="text-sm text-texto-2">{descricao}</p>
      </header>
      {itens.length === 0 ? (
        <p className="text-sm text-texto-2">{vazio}</p>
      ) : (
        <table role="table" aria-label={rotulo} className="block w-full">
          <thead role="rowgroup" className="sr-only sm:not-sr-only sm:block">
            <tr role="row" className={`${colunas} items-center gap-4 pl-4 pr-1 text-[0.8125rem] text-texto-2 sm:grid font-semibold`}>
              <th role="columnheader" scope="col" className="text-left font-semibold">Pessoa</th>
              <th role="columnheader" scope="col" className="text-left font-semibold">Te ensina</th>
              {troca && <th role="columnheader" scope="col" className="text-left font-semibold">Você ensina</th>}
              <th role="columnheader" scope="col"><span className="sr-only">Ação</span></th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block divide-y divide-linha border-y border-linha">
            {itens.map((m) => (
              <tr key={m.usuario.id} role="row" className={`relative grid grid-cols-6 gap-x-3 gap-y-2 pl-4 pr-1 py-3 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-marca ${colunas} sm:items-center sm:gap-4`}>
                <td role="cell" className="col-span-4 flex min-w-0 items-center gap-3 sm:col-span-1">
                  <span className="shrink-0 text-marca"><Icone nome="par" tamanho={20} /></span>
                  <Link href={`/perfil/${encodeURIComponent(m.usuario.username)}`} className="flex min-w-0 items-center gap-3">
                    <Avatar nome={m.usuario.name} url={m.usuario.avatar_url} tamanho="sm" />
                    <span className="min-w-0">
                      <span className="block whitespace-normal text-sm font-medium text-texto [overflow-wrap:anywhere]">{m.usuario.name}</span>
                      <span className="block truncate font-mono text-xs text-texto-3">@{m.usuario.username}</span>
                    </span>
                  </Link>
                </td>
                <td role="cell" className={`${habilidades} ${troca ? "col-span-3" : "col-span-6"} sm:col-span-1`}>
                  <span aria-hidden="true" className="basis-full text-[0.8125rem] text-texto-2 sm:hidden font-semibold">Te ensina</span>
                  {m.me_ensina.map((h) => <TagHabilidade key={h.id} nome={h.nome} tipo="sei" nivel={h.nivel} />)}
                </td>
                {troca && <td role="cell" className={`${habilidades} col-span-3 sm:col-span-1`}>
                  <span aria-hidden="true" className="basis-full text-[0.8125rem] text-texto-2 sm:hidden font-semibold">Você ensina</span>
                  {m.eu_ensino.map((h) => <TagHabilidade key={h.id} nome={h.nome} tipo="sei" nivel={h.nivel} />)}
                </td>}
                <td role="cell" className="order-1 col-span-2 justify-self-end sm:order-last sm:col-span-1">
                  <BotaoLink href={`/mensagens/${encodeURIComponent(m.usuario.username)}`} aria-label={`Conversar com ${m.usuario.name}`} tamanho="sm" variante={troca ? "troca" : "secundario"}>
                    Conversar
                  </BotaoLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function EmAndamento({ itens }: { itens: Match[] }) {
  if (itens.length === 0) return null;
  const quantidade = itens.length === 1 ? "1 conversa em andamento" : `${itens.length} conversas em andamento`;
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-1 [&::-webkit-details-marker]:hidden">
        <span className="text-[0.8125rem] font-semibold text-texto-2"><span className="font-mono font-medium numeros">03</span> · Em andamento</span>
        <span className="font-mono numeros text-xs text-texto-3">{quantidade}</span>
        <span className="text-sm text-texto-2 transition-transform duration-[var(--rapido)] group-open:rotate-180 motion-reduce:transition-none" aria-hidden>
          ▾
        </span>
      </summary>
      <ul className="mt-3 divide-y divide-linha border-y border-linha">
        {itens.map((m) => (
          <li key={m.usuario.id}>
            <Link
              href={`/mensagens/${encodeURIComponent(m.usuario.username)}`}
              className="flex items-center gap-3 px-1 py-3 hover:bg-superficie-2"
            >
              <span className="flex w-10 shrink-0 justify-center">
                <Avatar nome={m.usuario.name} url={m.usuario.avatar_url} tamanho="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-texto">{m.usuario.name}</span>
                <span className="block truncate font-mono text-xs text-texto-3">
                  {[...m.me_ensina, ...m.eu_ensino].map((h) => h.nome).join(" · ")}
                </span>
              </span>
              <span className="text-sm font-medium text-marca-forte">Abrir conversa</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function Pagina() {
  const [dados, setDados] = useState<MatchesComAndamento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await listarMatchesComAndamento());
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

  useEffect(() => {
    const temSessao = meuId() !== null;
    setLogado(temSessao);
    if (temSessao) carregar();
  }, [carregar]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Pares
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Quem te ensina o quê, e o que você ensina de volta.
        </p>
      </header>

      {logado === false && (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para ver seus pares.{" "}
          <Link href="/login" className={LINK_TEXTO}>
            Entrar
          </Link>
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
          <span className="sr-only">Carregando pares</span>
          <ul className="divide-y divide-linha border-y border-linha" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex h-14 items-center py-3">
                <span className="size-full animate-pulse bg-superficie-2 motion-reduce:animate-none" />
              </li>
            ))}
          </ul>
        </div>
      )}

      {logado && dados && dados.troca.length === 0 && dados.pode_te_ensinar.length === 0 && dados.em_andamento.length === 0 && (
        <Cartao className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-semibold tracking-tight text-texto">Comece pelo seu perfil</h2>
            <p className="max-w-[52ch] text-sm leading-relaxed text-texto-2">
              Diga o que você sabe e o que quer aprender. É com isso que a gente encontra quem pode te
              ensinar e com quem dá para trocar.
            </p>
          </div>
          <BotaoLink href="/perfil/editar#habilidades" className="shrink-0">
            Adicionar habilidades
          </BotaoLink>
        </Cartao>
      )}

      {logado && dados && (dados.troca.length > 0 || dados.pode_te_ensinar.length > 0 || dados.em_andamento.length > 0) && (
        <>
          <TabelaPares
            rotulo="01 · Pares de troca"
            descricao="Vocês dois têm algo para ensinar um ao outro."
            itens={dados.troca}
            troca
            vazio={
              <>
                Nenhum par de troca novo.{" "}
                <Link href="/perfil/editar#habilidades" className={LINK_TEXTO}>
                  Adicione o que você sabe no perfil
                </Link>
                .
              </>
            }
          />
          <TabelaPares
            rotulo="02 · Pode te ensinar"
            descricao="Sabem o que você quer aprender."
            itens={dados.pode_te_ensinar}
            troca={false}
            vazio={
              <>
                Ninguém novo sabe o que você quer aprender.{" "}
                <Link href="/perfil/editar#habilidades" className={LINK_TEXTO}>
                  Adicione mais habilidades no perfil
                </Link>
                .
              </>
            }
          />
          <EmAndamento itens={dados.em_andamento} />
        </>
      )}
    </div>
  );
}
