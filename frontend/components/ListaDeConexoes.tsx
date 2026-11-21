"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Cartao } from "@/components/ui/Cartao";
import { listarSeguidores, listarSeguindo, type Page, type User } from "@/lib/api";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 20;

export function ListaDeConexoes({
  username,
  tipo,
}: {
  username: string;
  tipo: "seguidores" | "seguindo";
}) {
  const [itens, setItens] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const eu = meuId();

  async function carregar(offset: number) {
    setCarregando(true);
    try {
      const buscar = tipo === "seguidores" ? listarSeguidores : listarSeguindo;
      const pagina: Page<User> = await buscar(username, offset, POR_PAGINA);
      setItens((anteriores) => (offset === 0 ? pagina.items : [...anteriores, ...pagina.items]));
      setTotal(pagina.total);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "não consegui carregar a lista");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar(0);
  }, [username, tipo]);

  const vazio =
    tipo === "seguidores"
      ? `Ninguém segue @${username} ainda.`
      : `@${username} ainda não segue ninguém.`;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-texto-2">@{username}</p>
        <nav className="flex gap-2 text-sm">
          <Link
            href={`/usuarios/${username}/seguidores`}
            className={`rounded-controle px-3 py-1.5 ${tipo === "seguidores" ? "bg-marca-suave text-marca-forte" : "text-texto-2 hover:text-texto"}`}
          >
            Seguidores
          </Link>
          <Link
            href={`/usuarios/${username}/seguindo`}
            className={`rounded-controle px-3 py-1.5 ${tipo === "seguindo" ? "bg-marca-suave text-marca-forte" : "text-texto-2 hover:text-texto"}`}
          >
            Seguindo
          </Link>
        </nav>
      </header>

      {erro && <p className="rounded-cartao border border-linha p-3 text-sm text-texto-2">{erro}</p>}

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
              {eu !== null && eu !== u.id && <BotaoSeguir username={u.username} tamanho="sm" />}
            </Cartao>
          </li>
        ))}
      </ul>

      {itens.length < total && (
        <button
          onClick={() => carregar(itens.length)}
          disabled={carregando}
          className="text-sm text-marca-forte hover:underline disabled:opacity-50"
        >
          {carregando ? "carregando..." : "carregar mais"}
        </button>
      )}
    </div>
  );
}
