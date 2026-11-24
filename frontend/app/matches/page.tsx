"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, type Match } from "@/lib/api";
import { listarMatchesComAndamento, type MatchesComAndamento } from "@/lib/trocas";
import { limparSessao, meuId } from "@/lib/sessao";

const LINK_TEXTO =
  "font-medium text-marca-forte underline underline-offset-2";

function CartaoMatch({ match, troca }: { match: Match; troca: boolean }) {
  const { usuario, me_ensina, eu_ensino } = match;
  return (
    <Cartao
      interativo
      className={`space-y-3 p-4 ${troca ? "ring-1 ring-troca" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Avatar nome={usuario.name} url={usuario.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-texto">{usuario.name}</p>
          <p className="truncate text-sm text-texto-2">@{usuario.username}</p>
        </div>
        <BotaoLink
          href={`/mensagens/${encodeURIComponent(usuario.username)}`}
          aria-label={`Conversar com ${usuario.name}`}
          tamanho="sm"
          variante={troca ? "troca" : "secundario"}
          magnetico={troca}
        >
          Conversar
        </BotaoLink>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-texto-2">Te ensina</span>
          {me_ensina.map((h) => (
            <TagHabilidade
              key={h.id}
              nome={h.nome}
              tipo="sei"
              nivel={h.nivel}
              destaque={troca}
            />
          ))}
        </div>
        {troca && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-texto-2">Você ensina</span>
            {eu_ensino.map((h) => (
              <TagHabilidade
                key={h.id}
                nome={h.nome}
                tipo="sei"
                nivel={h.nivel}
              />
            ))}
          </div>
        )}
      </div>
    </Cartao>
  );
}

function Secao({
  titulo,
  descricao,
  itens,
  troca,
  vazio,
}: {
  titulo: string;
  descricao: string;
  itens: Match[];
  troca: boolean;
  vazio: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
        <p className="text-sm text-texto-2">{descricao}</p>
      </header>
      {itens.length === 0 ? (
        <p className="text-sm text-texto-2">{vazio}</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((m) => (
            <li key={m.usuario.id}>
              <CartaoMatch match={m} troca={troca} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmAndamento({ itens }: { itens: Match[] }) {
  if (itens.length === 0) return null;
  const quantidade = itens.length === 1 ? "1 conversa em andamento" : `${itens.length} conversas em andamento`;
  return (
    <details className="group rounded-cartao border border-linha bg-superficie shadow-cartao">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-10 -space-x-2" aria-hidden>
          {itens.slice(0, 4).map((m) => (
            <span key={m.usuario.id} className="rounded-full ring-2 ring-superficie">
              <Avatar nome={m.usuario.name} url={m.usuario.avatar_url} tamanho="sm" />
            </span>
          ))}
        </span>
        <span className="flex-1">
          <span className="block font-medium text-texto">Em andamento</span>
          <span className="block text-sm text-texto-2">{quantidade}</span>
        </span>
        <span className="text-sm text-texto-2 transition-transform duration-[var(--rapido)] group-open:rotate-180 motion-reduce:transition-none" aria-hidden>
          ▾
        </span>
      </summary>
      <ul className="divide-y divide-linha border-t border-linha">
        {itens.map((m) => (
          <li key={m.usuario.id}>
            <Link
              href={`/mensagens/${encodeURIComponent(m.usuario.username)}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-superficie-2"
            >
              <span className="flex w-10 shrink-0 justify-center">
                <Avatar nome={m.usuario.name} url={m.usuario.avatar_url} tamanho="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-texto">{m.usuario.name}</span>
                <span className="block truncate text-xs text-texto-2">
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
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Matches
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Quem pode te ensinar o que você quer aprender, e com quem dá para trocar.
        </p>
      </header>

      {logado === false && (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para ver seus matches.{" "}
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
          <span className="sr-only">Carregando matches</span>
          <ul className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-28 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none"
              />
            ))}
          </ul>
        </div>
      )}

      {logado && dados && dados.troca.length === 0 && dados.pode_te_ensinar.length === 0 && dados.em_andamento.length === 0 && (
        <Cartao className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-texto">Comece pelo seu perfil</h2>
            <p className="max-w-[52ch] text-sm leading-relaxed text-texto-2">
              Diga o que você sabe e o que quer aprender. É com isso que a gente encontra quem pode te
              ensinar e com quem dá para trocar.
            </p>
          </div>
          <BotaoLink href="/perfil/editar#habilidades" magnetico className="shrink-0">
            Adicionar habilidades
          </BotaoLink>
        </Cartao>
      )}

      {logado && dados && (dados.troca.length > 0 || dados.pode_te_ensinar.length > 0 || dados.em_andamento.length > 0) && (
        <>
          <Secao
            titulo="Match de troca"
            descricao="Vocês dois têm algo para ensinar um ao outro."
            itens={dados.troca}
            troca
            vazio={
              <>
                Nenhum match de troca novo.{" "}
                <Link href="/perfil/editar#habilidades" className={LINK_TEXTO}>
                  Adicione o que você sabe no perfil
                </Link>
                .
              </>
            }
          />
          <Secao
            titulo="Pode te ensinar"
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
