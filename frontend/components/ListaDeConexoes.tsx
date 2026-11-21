"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Cartao } from "@/components/ui/Cartao";
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
      <header className="space-y-3">
        <p className="text-sm text-texto-2">@{username}</p>
        <nav className="flex gap-2 text-sm">
          {(["seguidores", "seguindo"] as const).map((aba) => (
            <Link
              key={aba}
              href={`/usuarios/${encodeURIComponent(username)}/${aba}`}
              aria-current={tipo === aba ? "page" : undefined}
              className={`rounded-controle px-3 py-1.5 ${
                tipo === aba ? "bg-marca-suave text-marca-forte" : "text-texto-2 hover:text-texto"
              }`}
            >
              {aba === "seguidores" ? "Seguidores" : "Seguindo"}
            </Link>
          ))}
        </nav>
      </header>

      {erro && (
        <Cartao className="flex items-center justify-between gap-3 p-3">
          <p role="alert" className="text-sm text-texto-2">
            {erro}
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={() => carregar(itens.length ? offset : 0)}>
            Tentar de novo
          </Botao>
        </Cartao>
      )}

      {carregando && itens.length === 0 && !erro && (
        <ul className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-cartao bg-superficie-2" />
          ))}
        </ul>
      )}

      {!erro && !carregando && itens.length === 0 && <p className="text-sm text-texto-2">{vazio}</p>}

      <ul className="space-y-2">
        {itens.map((u) => (
          <li key={u.id}>
            <Cartao className="flex items-center gap-3 p-3">
              <Avatar nome={u.name} url={u.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-texto">{u.name}</p>
                <p className="truncate text-sm text-texto-2">
                  @{u.username}
                  {u.bio ? ` · ${u.bio}` : ""}
                </p>
              </div>
              {eu !== undefined && eu !== u.id && (
                <BotaoSeguir username={u.username} seguindoInicial={u.eu_sigo} tamanho="sm" />
              )}
            </Cartao>
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
