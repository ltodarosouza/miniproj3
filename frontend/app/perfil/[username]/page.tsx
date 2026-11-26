"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentosNivel } from "@/components/perfil/EditorHabilidades";
import { CartaoPost } from "@/components/posts/CartaoPost";
import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Icone } from "@/components/ui/Icone";
import { Revelar } from "@/components/ui/Revelar";
import { ErroApi, listarMatches } from "@/lib/api";
import { buscarPerfil, listarPostsDoUsuario, type Perfil } from "@/lib/perfil";
import { type Post } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

const POSTS_POR_PAGINA = 10;

type InfoTroca = { euEnsino: string; elaEnsina: string } | null;

const DIAS_DA_SEMANA = 7;
const ROTULO = "font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-3";
// Contorno claro para os botões secundários sobre a faixa grafite.
const CONTORNO_CLARO = "border-grafite-texto/50! text-grafite-texto! hover:border-grafite-texto!";

// Um número da linha tabular da ficha: valor em mono e rótulo pequeno embaixo.
function Numero({ valor, rotulo, href, children }: { valor: ReactNode; rotulo: string; href?: string; children?: ReactNode }) {
  const corpo = (
    <>
      <span className="block font-mono text-xl text-texto numeros">{valor}</span>
      {children}
      <span className={`mt-1 block ${ROTULO}`}>{rotulo}</span>
    </>
  );
  const classe = "block min-w-0 px-2 py-3 sm:px-4 sm:first:pl-0";
  if (href) {
    return (
      <Link href={href} className={`${classe} transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none`}>
        {corpo}
      </Link>
    );
  }
  return <div className={classe}>{corpo}</div>;
}

function ColunaHabilidades({ numero, titulo, lista }: { numero: string; titulo: string; lista: Perfil["habilidades"] }) {
  return (
    <section aria-labelledby={`habilidades-${numero}`}>
      <h3 id={`habilidades-${numero}`} className={`border-b border-linha pb-2 ${ROTULO}`}>
        <span className="text-texto-2 numeros">{numero}</span> · {titulo}
      </h3>
      {lista.length === 0 ? (
        <p className="py-3 text-sm text-texto-3">Nada por aqui ainda.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {lista.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[0.9375rem] text-texto">{h.nome}</span>
              <SegmentosNivel nivel={h.nivel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SecaoHabilidades({ habilidades, souEu }: { habilidades: Perfil["habilidades"]; souEu: boolean }) {
  const sei = habilidades.filter((h) => h.tipo === "sei");
  const quero = habilidades.filter((h) => h.tipo === "quero_aprender");

  if (sei.length === 0 && quero.length === 0) {
    if (!souEu) return null;
    return (
      <div className="space-y-3 border-y border-linha py-5">
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
    <section aria-labelledby="titulo-habilidades" className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-habilidades" className="font-display text-xl font-semibold tracking-tight text-texto">
          Habilidades
        </h2>
        {souEu && (
          <Link href="/perfil/editar#habilidades" className="text-sm font-medium text-marca-forte hover:underline">
            Editar habilidades
          </Link>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <ColunaHabilidades numero="01" titulo="Sei" lista={sei} />
        <ColunaHabilidades numero="02" titulo="Quero aprender" lista={quero} />
      </div>
    </section>
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
  // Username da tela atual: respostas atrasadas de outro perfil são descartadas.
  const usernameAtual = useRef(username);
  usernameAtual.current = username;

  useEffect(() => {
    setEu(meuId());
  }, []);

  const carregarPerfil = useCallback(async () => {
    setCarregandoPerfil(true);
    setErro(null);
    try {
      const dados = await buscarPerfil(username);
      if (usernameAtual.current === username) setPerfil(dados);
    } catch (err) {
      if (usernameAtual.current !== username) return;
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
        if (usernameAtual.current !== username) return;
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
    setInfoTroca(null);
    if (!eu) return;
    let ativo = true;
    listarMatches()
      .then((matches) => {
        if (!ativo) return;
        const match = matches.troca.find((m) => m.usuario.username === username);
        if (!match) return;
        const euEnsino = match.eu_ensino[0]?.nome;
        const elaEnsina = match.me_ensina[0]?.nome;
        if (euEnsino && elaEnsina) {
          setInfoTroca({ euEnsino, elaEnsina });
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [username, eu]);

  useEffect(() => {
    setPosts([]);
    setTotalPosts(0);
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
        <div className="flex items-center gap-4 rounded-cartao bg-superficie-2 p-6">
          <div className="size-20 animate-pulse rounded-controle bg-linha motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 animate-pulse rounded-controle bg-linha motion-reduce:animate-none" />
            <div className="h-4 w-24 animate-pulse rounded-controle bg-linha motion-reduce:animate-none" />
          </div>
        </div>
        <div className="h-16 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
      </div>
    );
  } else if (erro || !perfil) {
    conteudo = (
      <div className="flex flex-col items-start gap-3 border-y border-linha py-6">
        <p role="alert" className="text-texto-2">
          {erro ?? "não consegui carregar este perfil"}
        </p>
        <Botao variante="secundario" tamanho="sm" onClick={carregarPerfil}>
          Tentar de novo
        </Botao>
      </div>
    );
  } else {
    const souEu = eu === perfil.id;

    conteudo = (
      <div className="space-y-8">
        <section aria-label="Ficha" className="overflow-hidden rounded-cartao border border-linha">
          <div className="flex flex-col gap-5 bg-grafite p-5 text-grafite-texto sm:flex-row sm:items-start sm:p-6">
            <div className="shrink-0 *:size-20! *:text-2xl!">
              <Avatar nome={perfil.name} url={perfil.avatar_url} tamanho="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-bold leading-tight tracking-[-0.025em] break-words">
                {perfil.name}
              </h1>
              <p className="truncate font-mono text-sm opacity-70">@{perfil.username}</p>
              {perfil.bio && (
                <p className="mt-3 max-w-[60ch] whitespace-pre-line text-[0.9375rem] leading-relaxed opacity-90">
                  {perfil.bio}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {souEu ? (
                  <BotaoLink href="/perfil/editar" variante="secundario" tamanho="sm" className={CONTORNO_CLARO}>
                    Editar perfil
                  </BotaoLink>
                ) : (
                  <>
                    <BotaoSeguir username={perfil.username} aoMudar={atualizarSeguidores} tamanho="sm" sobreGrafite />
                    <BotaoLink
                      href={`/mensagens/${encodeURIComponent(perfil.username)}`}
                      variante={infoTroca ? "primario" : "secundario"}
                      tamanho="sm"
                      className={infoTroca ? "" : CONTORNO_CLARO}
                    >
                      {infoTroca ? "Propor troca" : "Mensagem"}
                    </BotaoLink>
                  </>
                )}
              </div>
            </div>
          </div>

          {!souEu && infoTroca && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-linha bg-superficie px-5 py-3 text-sm text-texto sm:px-6">
              <span className="text-marca-forte">
                <Icone nome="par" tamanho={18} />
              </span>
              Vocês podem trocar:
              <span className="font-mono numeros">
                {infoTroca.euEnsino} ↔ {infoTroca.elaEnsina}
              </span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-4 border-t border-linha bg-superficie px-5 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-linha sm:[&>*:nth-child(n+3)]:border-t-0 sm:grid-cols-4 sm:gap-x-0 sm:divide-x sm:divide-linha sm:px-6">
            <Numero
              valor={perfil.seguidores}
              rotulo="seguidores"
              href={`/usuarios/${encodeURIComponent(perfil.username)}/seguidores`}
            />
            <Numero
              valor={perfil.seguindo}
              rotulo="seguindo"
              href={`/usuarios/${encodeURIComponent(perfil.username)}/seguindo`}
            />
            <Numero valor={`${perfil.streak}d`} rotulo="dias seguidos">
              <span className="mt-1.5 flex max-w-24 gap-0.5" aria-hidden="true">
                {Array.from({ length: DIAS_DA_SEMANA }, (_, i) => (
                  <span key={i} className={`h-1 flex-1 rounded-[1px] ${i < Math.min(perfil.streak, DIAS_DA_SEMANA) ? "bg-marca" : "bg-texto-3/40"}`} />
                ))}
              </span>
            </Numero>
            <Numero
              valor={perfil.total_avaliacoes > 0 ? (perfil.media_avaliacoes ?? 0).toFixed(1).replace(".", ",") : "–"}
              rotulo={
                perfil.total_avaliacoes > 0
                  ? `${perfil.total_avaliacoes} ${perfil.total_avaliacoes === 1 ? "avaliação" : "avaliações"}`
                  : "sem avaliação"
              }
            />
          </div>
        </section>

        <SecaoHabilidades habilidades={perfil.habilidades} souEu={souEu} />

        <section aria-labelledby="titulo-posts" className="space-y-2">
          <h2 id="titulo-posts" className="font-display text-xl font-semibold tracking-tight text-texto">
            Diário <span className="font-mono text-sm font-normal text-texto-3 numeros">{totalPosts}</span>
          </h2>

          {carregandoPosts ? (
            <div className="divide-y divide-linha border-y border-linha" aria-label="Carregando posts">
              {[0, 1].map((i) => (
                <div key={i} className="py-5">
                  <div className="h-20 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
                </div>
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
              <ul className="divide-y divide-linha border-y border-linha">
                {posts.map((post, i) => (
                  <li key={post.id}>
                    <Revelar atraso={Math.min(i, 6) * 40}>
                      <CartaoPost post={post} />
                    </Revelar>
                  </li>
                ))}
              </ul>
              {posts.length < totalPosts && (
                <div className="pt-4">
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
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {conteudo}
    </div>
  );
}
