"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { ErroApi, listarConexoes, type Conexao } from "@/lib/api";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 20;

type Tipo = "seguidores" | "seguindo";

function juntarSemRepetir(anteriores: Conexao[], novos: Conexao[]): Conexao[] {
  const vistos = new Set(anteriores.map((u) => u.id));
  return [...anteriores, ...novos.filter((u) => !vistos.has(u.id))];
}

export function ListaDeConexoes({ username, tipo }: { username: string; tipo: Tipo }) {
  const [itens, setItens] = useState<Conexao[]>([]);
  const [offset, setOffset] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [eu, setEu] = useState<number | null | undefined>(undefined);
  const [temMais, setTemMais] = useState(false);
  const pedidoAtual = useRef(0);

  useEffect(() => {
    setEu(meuId());
  }, []);

  const carregar = useCallback(
    async (deslocamento: number) => {
      const pedido = ++pedidoAtual.current;
      setCarregando(true);
      setErro(null);
      try {
        const pagina = await listarConexoes(username, tipo, deslocamento, POR_PAGINA);
        if (pedido !== pedidoAtual.current) return;
        setItens((anteriores) =>
          deslocamento === 0 ? pagina.items : juntarSemRepetir(anteriores, pagina.items),
        );
        const proximo = deslocamento + pagina.items.length;
        setOffset(proximo);
        setTemMais(pagina.items.length > 0 && proximo < pagina.total);
      } catch (err) {
        if (pedido !== pedidoAtual.current) return;
        setErro(
          err instanceof ErroApi ? err.message : "sem conexão com o servidor, tente de novo",
        );
      } finally {
        if (pedido === pedidoAtual.current) setCarregando(false);
      }
    },
    [username, tipo],
  );

  useEffect(() => {
    setItens([]);
    setOffset(0);
    setTemMais(false);
    carregar(0);
    return () => {
      pedidoAtual.current++;
    };
  }, [carregar]);

  const vazio =
    tipo === "seguidores"
      ? `Ninguém segue @${username} ainda.`
      : `@${username} ainda não segue ninguém.`;

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-0.025em] text-texto">
            {tipo === "seguidores" ? "Seguidores" : "Seguindo"}
          </h1>
          <Link
            href={`/perfil/${encodeURIComponent(username)}`}
            className="font-mono text-xs text-texto-3 hover:text-texto hover:underline"
          >
            @{username}
          </Link>
        </div>
        <nav aria-label="Conexões" className="flex gap-5 border-b border-linha text-sm">
          {(["seguidores", "seguindo"] as const).map((aba) => (
            <Link
              key={aba}
              href={`/usuarios/${encodeURIComponent(username)}/${aba}`}
              aria-current={tipo === aba ? "page" : undefined}
              className={`-mb-px border-b-2 pb-2 ${
                tipo === aba ? "border-marca font-medium text-texto" : "border-transparent text-texto-2 hover:text-texto"
              }`}
            >
              {aba === "seguidores" ? "Seguidores" : "Seguindo"}
            </Link>
          ))}
        </nav>
      </header>

      {erro && (
        <div className="flex items-center justify-between gap-3 border-y border-linha py-3">
          <p role="alert" className="text-sm text-texto-2">
            {erro}
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={() => carregar(itens.length ? offset : 0)}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {carregando && itens.length === 0 && !erro && (
        <ul className="divide-y divide-linha" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="py-3">
              <div className="h-10 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      )}

      {!erro && !carregando && itens.length === 0 && <p className="text-sm text-texto-2">{vazio}</p>}

      <ul className="divide-y divide-linha">
        {itens.map((u) => (
          <li key={u.id} className="flex items-center gap-3 py-3">
              <Link
                href={`/perfil/${encodeURIComponent(u.username)}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-controle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
              >
                <Avatar nome={u.name} url={u.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate font-medium text-texto hover:underline">{u.name}</span>
                    <span className="hidden truncate font-mono text-xs text-texto-3 sm:inline">@{u.username}</span>
                  </p>
                  {u.bio && <p className="truncate text-sm text-texto-2">{u.bio}</p>}
                </div>
              </Link>
              {eu !== undefined && eu !== u.id && (
                <BotaoSeguir username={u.username} seguindoInicial={u.eu_sigo} tamanho="sm" contorno />
              )}
          </li>
        ))}
      </ul>

      {temMais && !erro && (
        <Botao variante="fantasma" carregando={carregando} onClick={() => carregar(offset)}>
          Carregar mais
        </Botao>
      )}
    </div>
  );
}
