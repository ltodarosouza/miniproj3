"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { CartaoPost } from "@/components/posts/CartaoPost";
import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Cartao } from "@/components/ui/Cartao";
import { Estrelas } from "@/components/ui/Estrelas";
import { Icone } from "@/components/ui/Icone";
import { Revelar } from "@/components/ui/Revelar";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, listarMatches } from "@/lib/api";
import { buscarPerfil, listarPostsDoUsuario, type Perfil } from "@/lib/perfil";
import { type Post } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

const POSTS_POR_PAGINA = 10;

type InfoTroca = { euEnsino: string; elaEnsina: string } | null;

function Contador({
  valor,
  rotulo,
  href,
}: {
  valor: number;
  rotulo: string;
  href?: string;
}) {
  const corpo = (
    <>
      <span className="numeros block text-lg font-semibold leading-none text-texto">
        {valor}
      </span>
      <span className="text-xs text-texto-2">{rotulo}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex flex-col items-center gap-0.5 rounded-controle px-2 py-1 transition-colors hover:bg-superficie-2"
      >
        {corpo}
      </Link>
    );
  }

  return (
    <span className="flex flex-col items-center gap-0.5 px-2 py-1">
      {corpo}
    </span>
  );
}

function SecaoHabilidades({ habilidades, souEu }: { habilidades: Perfil["habilidades"]; souEu: boolean }) {
  const sei = habilidades.filter((h) => h.tipo === "sei");
  const quero = habilidades.filter((h) => h.tipo === "quero_aprender");

  if (sei.length === 0 && quero.length === 0) {
    if (!souEu) return null;
    return (
      <div className="space-y-3 rounded-cartao border border-dashed border-linha-forte p-5">
        <p className="text-sm text-texto-2">
          Você ainda não disse o que sabe nem o que quer aprender. Sem isso, os matches ficam vazios.
        </p>
        <BotaoLink tamanho="sm" href="/perfil/editar#habilidades">
          Adicionar habilidades
        </BotaoLink>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sei.length > 0 && (
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-texto-2">Sei</h2>
            {souEu && (
              <Link
                href="/perfil/editar#habilidades"
                className="text-sm font-medium text-marca-forte hover:underline"
              >
                Editar habilidades
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {sei.map((h) => (
              <TagHabilidade key={h.id} nome={h.nome} tipo="sei" nivel={h.nivel} />
            ))}
          </div>
        </section>
      )}
      {quero.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-texto-2">Quero aprender</h2>
          <div className="flex flex-wrap gap-2">
            {quero.map((h) => (
              <TagHabilidade key={h.id} nome={h.nome} tipo="quero_aprender" nivel={h.nivel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function PerfilPage() {
  const { username } = useParams<{ username: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [carregandoPosts, setCarregandoPosts] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eu, setEu] = useState<number | null>(null);
  const [infoTroca, setInfoTroca] = useState<InfoTroca>(null);

  useEffect(() => {
    setEu(meuId());
  }, []);

  const carregarPerfil = useCallback(async () => {
    setCarregandoPerfil(true);
    setErro(null);
    try {
      setPerfil(await buscarPerfil(username));
    } catch (err) {
      setErro(
        err instanceof ErroApi
          ? err.status === 404
            ? "pessoa não encontrada"
            : err.message
          : "sem conexão com o servidor, tente de novo",
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }, [username]);

  const carregarPosts = useCallback(
    async (offset: number) => {
      if (offset === 0) setCarregandoPosts(true);
      else setCarregandoMais(true);
      try {
        const pagina = await listarPostsDoUsuario(username, offset, POSTS_POR_PAGINA);
        setPosts((atuais) => (offset === 0 ? pagina.items : [...atuais, ...pagina.items]));
        setTotalPosts(pagina.total);
      } catch {
        // Posts são secundários: não quebramos a tela, só ignoramos o erro.
      } finally {
        setCarregandoPosts(false);
        setCarregandoMais(false);
      }
    },
    [username],
  );

  // Verifica se há match de troca com este usuário
  useEffect(() => {
    if (!eu) return;
    listarMatches()
      .then((matches) => {
        const match = matches.troca.find((m) => m.usuario.username === username);
        if (!match) return;
        const euEnsino = match.eu_ensino[0]?.nome;
        const elaEnsina = match.me_ensina[0]?.nome;
        if (euEnsino && elaEnsina) {
          setInfoTroca({ euEnsino, elaEnsina });
        }
      })
      .catch(() => {});
  }, [username, eu]);

  useEffect(() => {
    void carregarPerfil();
    void carregarPosts(0);
  }, [carregarPerfil, carregarPosts]);

  function atualizarSeguidores(estado: { seguidores: number }) {
    setPerfil((atual) => (atual ? { ...atual, seguidores: estado.seguidores } : null));
  }

  let conteudo: ReactNode;

  if (carregandoPerfil) {
    conteudo = (
      <div className="space-y-6" aria-busy="true" aria-label="Carregando perfil">
        <div className="flex items-center gap-4">
          <div className="size-16 animate-pulse rounded-full bg-superficie-2 motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-superficie-2 motion-reduce:animate-none" />
            <div className="h-4 w-24 animate-pulse rounded bg-superficie-2 motion-reduce:animate-none" />
          </div>
        </div>
        <div className="h-20 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none" />
      </div>
    );
  } else if (erro || !perfil) {
    conteudo = (
      <Cartao className="flex flex-col items-center gap-3 p-6 text-center">
        <p role="alert" className="text-texto-2">
          {erro ?? "não consegui carregar este perfil"}
        </p>
        <Botao variante="secundario" tamanho="sm" onClick={carregarPerfil}>
          Tentar de novo
        </Botao>
      </Cartao>
    );
  } else {
    const souEu = eu === perfil.id;

    conteudo = (
      <div className="space-y-6">
        <Cartao className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <Avatar nome={perfil.name} url={perfil.avatar_url} tamanho="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-semibold text-texto">
                {perfil.name}
              </h1>
              <p className="truncate text-sm text-texto-2">@{perfil.username}</p>
              {perfil.bio && (
                <p className="mt-2 max-w-[65ch] whitespace-pre-line text-[0.9375rem] leading-relaxed text-texto">
                  {perfil.bio}
                </p>
              )}
            </div>
            <div className="shrink-0">
              {souEu ? (
                <BotaoLink href="/perfil/editar" variante="secundario" tamanho="sm">
                  Editar
                </BotaoLink>
              ) : (
                <div className="flex gap-2">
                  <BotaoSeguir
                    username={perfil.username}
                    aoMudar={atualizarSeguidores}
                    tamanho="sm"
                  />
                  <BotaoLink
                    href={`/mensagens/${encodeURIComponent(perfil.username)}`}
                    variante={infoTroca ? "primario" : "secundario"}
                    tamanho="sm"
                  >
                    {infoTroca ? "Propor troca" : "Mensagem"}
                  </BotaoLink>
                </div>
              )}
            </div>
          </div>

          {/* Destaque de match de troca */}
          {!souEu && infoTroca && (
            <div className="mt-4 flex items-center gap-2 rounded-controle bg-troca-suave px-3 py-2 text-sm text-texto">
              <Icone nome="trocar" tamanho={16} />
              <span>
                Vocês podem trocar:{" "}
                <strong>{infoTroca.euEnsino}</strong>
                {" ↔ "}
                <strong>{infoTroca.elaEnsina}</strong>
              </span>
            </div>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 border-y border-linha bg-superficie-2/40 py-3">
            <Contador
              valor={perfil.seguidores}
              rotulo="seguidores"
              href={`/usuarios/${encodeURIComponent(perfil.username)}/seguidores`}
            />
            <span className="h-8 w-px bg-linha" />
            <Contador
              valor={perfil.seguindo}
              rotulo="seguindo"
              href={`/usuarios/${encodeURIComponent(perfil.username)}/seguindo`}
            />
            <span className="h-8 w-px bg-linha" />
            <Contador valor={perfil.streak} rotulo="dias seguidos" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {perfil.total_avaliacoes > 0 ? (
              <>
                <Estrelas valor={perfil.media_avaliacoes ?? 0} />
                <span className="numeros text-sm text-texto-2">
                  {perfil.media_avaliacoes?.toFixed(1).replace(".", ",")} ·{" "}
                  {perfil.total_avaliacoes}{" "}
                  {perfil.total_avaliacoes === 1 ? "avaliação" : "avaliações"}
                </span>
              </>
            ) : (
              <span className="text-sm text-texto-2">Ainda não foi avaliado como professor</span>
            )}
          </div>
        </Cartao>

        <SecaoHabilidades habilidades={perfil.habilidades} souEu={souEu} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-texto">Posts</h2>

          {carregandoPosts ? (
            <div className="space-y-4" aria-label="Carregando posts">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-texto-2">
              {souEu
                ? "Você ainda não publicou nada."
                : "@" + perfil.username + " ainda não publicou nada."}
            </p>
          ) : (
            <>
              <ul className="space-y-4">
                {posts.map((post, i) => (
                  <li key={post.id}>
                    <Revelar atraso={Math.min(i, 6) * 40}>
                      <CartaoPost post={post} />
                    </Revelar>
                  </li>
                ))}
              </ul>
              {posts.length < totalPosts && (
                <div className="flex justify-center">
                  <Botao
                    variante="secundario"
                    carregando={carregandoMais}
                    onClick={() => carregarPosts(posts.length)}
                  >
                    Carregar mais
                  </Botao>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Perfil
        </h1>
      </header>
      {conteudo}
    </div>
  );
}