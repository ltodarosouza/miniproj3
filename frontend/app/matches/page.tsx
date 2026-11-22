"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, listarMatches, type HabilidadeComNivel, type Match, type Matches } from "@/lib/api";

function nomes(habilidades: HabilidadeComNivel[]): string {
  return habilidades.map((h) => h.nome).join(", ");
}

function CartaoMatch({ match, troca }: { match: Match; troca: boolean }) {
  const router = useRouter();
  const { usuario, me_ensina, eu_ensino } = match;
  return (
    <Cartao className={`space-y-3 p-4 ${troca ? "ring-1 ring-troca" : ""}`}>
      <div className="flex items-center gap-3">
        <Avatar nome={usuario.name} url={usuario.avatar_url} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-texto">{usuario.name}</p>
          <p className="truncate text-sm text-texto-2">@{usuario.username}</p>
        </div>
        <Botao
          tamanho="sm"
          variante={troca ? "troca" : "secundario"}
          onClick={() => router.push(`/mensagens/${encodeURIComponent(usuario.username)}`)}
        >
          Conversar
        </Botao>
      </div>
      {troca && (
        <p className="text-sm text-texto">
          Te ensina {nomes(me_ensina)}, você ensina {nomes(eu_ensino)}
        </p>
      )}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-texto-2">Te ensina</span>
          {me_ensina.map((h) => (
            <TagHabilidade key={h.id} nome={h.nome} tipo="sei" nivel={h.nivel} destaque={troca} />
          ))}
        </div>
        {troca && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-texto-2">Você ensina</span>
            {eu_ensino.map((h) => (
              <TagHabilidade key={h.id} nome={h.nome} tipo="sei" nivel={h.nivel} />
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
  vazio: string;
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

export default function Pagina() {
  const [dados, setDados] = useState<Matches | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setDados(await listarMatches());
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : "sem conexão com o servidor, tente de novo");
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-texto">Matches</h1>

      {erro && (
        <Cartao className="flex items-center justify-between gap-3 p-3">
          <p role="alert" className="text-sm text-texto-2">
            {erro}
          </p>
          <Botao variante="secundario" tamanho="sm" onClick={carregar}>
            Tentar de novo
          </Botao>
        </Cartao>
      )}

      {!dados && !erro && (
        <ul className="space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-28 animate-pulse rounded-cartao bg-superficie-2" />
          ))}
        </ul>
      )}

      {dados && (
        <>
          <Secao
            titulo="Match de troca"
            descricao="Vocês dois têm algo para ensinar um ao outro."
            itens={dados.troca}
            troca
            vazio="Nenhuma troca ainda. Adicione o que você sabe no perfil."
          />
          <Secao
            titulo="Pode te ensinar"
            descricao="Sabem o que você quer aprender."
            itens={dados.pode_te_ensinar}
            troca={false}
            vazio="Ninguém sabe o que você quer aprender ainda. Adicione mais habilidades no perfil."
          />
        </>
      )}
    </div>
  );
}
