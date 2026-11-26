"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ColunaDescoberta } from "@/components/feed/ColunaDescoberta";
import { Composer } from "@/components/feed/Composer";
import { CarrosselPodeTeEnsinar } from "@/components/feed/PodeTeEnsinar";
import { CartaoPost } from "@/components/posts/CartaoPost";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { PuxarParaAtualizar } from "@/components/ui/PuxarParaAtualizar";
import { Revelar } from "@/components/ui/Revelar";
import { EsqueletoPost } from "@/components/ui/Esqueleto";
import { dataLocal } from "@/lib/datas";
import { listarMatches, type Match, type Page } from "@/lib/api";
import {
  listarEmAlta,
  listarFeed,
  obterMeuProgresso,
  type HabilidadeEmAlta,
  type ItemFeed,
  type MeuProgresso,
  formatarTempoEstudado,
  type Post,
} from "@/lib/posts";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 20;
// "Fim do Diário." só aparece quando a lista tem mais posts que isso.
const MINIMO_PARA_AVISAR_FIM = 10;
// Pede a próxima página quando faltam umas duas telas para o fim da lista.
const ANTECIPAR_CARREGAMENTO = "1500px 0px";
// Os cartões começam a animar um pouco antes de entrar na tela.
const ANTECIPAR_ANIMACAO = "200px";
const PESSOAS_NA_LATERAL = 5;
const CARROSSEL_DEPOIS_DO = 3;

const HOJE = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" });

// Mais estudadas em uma linha: "1º Algoritmos 3h05". Mostra a posição no ranking dos últimos 7 dias.
function MaisEstudadas({ habilidades }: { habilidades: HabilidadeEmAlta[] }) {
  if (!habilidades.length) return null;
  return (
    <ul tabIndex={0} aria-label="Mais estudadas nos últimos 7 dias, por horas" className="lg:hidden flex rounded-controle focus-visible:outline-2 focus-visible:outline-marca gap-x-5 gap-y-1 overflow-x-auto border-y border-linha py-2 font-mono text-xs text-texto-2 [scrollbar-width:none]! [&::-webkit-scrollbar]:hidden">
      <li className="shrink-0 whitespace-nowrap text-texto-3">Mais estudadas · 7 dias</li>
      {habilidades.map((h, i) => {
        return (
          <li key={h.id} className="shrink-0 whitespace-nowrap numeros">
            <span className="text-marca-forte">{i + 1}º</span> <span className="inline-block max-w-[12rem] truncate align-bottom text-texto">{h.nome}</span>{" "}
            {h.minutos > 0 ? formatarTempoEstudado(h.minutos) : `${h.posts} ${h.posts === 1 ? "post" : "posts"}`}
          </li>
        );
      })}
    </ul>
  );
}

function Feed() {
  const parametros = useSearchParams();
  const roteador = useRouter();
  const caminho = usePathname();
  const [pedidoDeAbrir, setPedidoDeAbrir] = useState(0);
  const [itens, setItens] = useState<ItemFeed[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [logado, setLogado] = useState(true);
  const [pessoas, setPessoas] = useState<Match[] | null>(null);
  const [emAlta, setEmAlta] = useState<HabilidadeEmAlta[] | null>(null);
  const [progresso, setProgresso] = useState<MeuProgresso | null>(null);
  const [tamanhoPrimeiraPagina, setTamanhoPrimeiraPagina] = useState(0);
  // A data só existe no navegador, para não divergir entre servidor e cliente.
  const [hoje, setHoje] = useState<Date | null>(null);
  useEffect(() => setHoje(new Date()), []);
  const sentinela = useRef<HTMLDivElement>(null);
  const buscando = useRef(false);
  const geracao = useRef(0);
  // Próxima página já pedida em segundo plano, para aparecer na hora quando a pessoa chegar lá.
  const reserva = useRef<{ offset: number; geracao: number; pagina: Promise<Page<ItemFeed>>; pronta: boolean } | null>(null);
  // Posição da próxima página no servidor. Não usa itens.length, que não anda quando a página volta só com posts repetidos.
  const [proximoOffset, setProximoOffset] = useState(0);
  // Cópia em ref para a busca somar por cima de ajustes (publicar/apagar) feitos enquanto ela esperava.
  const proximoRef = useRef(0);
  const mudarProximo = useCallback((valor: number) => {
    proximoRef.current = Math.max(0, valor);
    setProximoOffset(proximoRef.current);
  }, []);

  const buscar = useCallback(async (offset: number) => {
    // Recomeçar do topo invalida qualquer "carregar mais" em andamento.
    if (offset === 0) geracao.current += 1;
    const minha = geracao.current;
    buscando.current = true;
    const guardada = reserva.current;
    reserva.current = null;
    try {
      const pagina =
        guardada && guardada.offset === offset && guardada.geracao === minha
          ? await guardada.pagina
          : await listarFeed(offset, POR_PAGINA);
      if (minha !== geracao.current) return;
      setItens((atuais) => {
        if (offset === 0) return pagina.items;
        const ids = new Set(atuais.map((i) => i.id));
        return [...atuais, ...pagina.items.filter((i) => !ids.has(i.id))];
      });
      if (offset === 0) setTamanhoPrimeiraPagina(pagina.items.length);
      // Supõe que o servidor respondeu antes de qualquer publicar/apagar feito durante a espera.
      // Se ele já tiver visto a mudança, pode pular ou repetir um post (o repetido é filtrado por id);
      // resolver de vez exigiria paginação por cursor no backend.
      const proximo = (offset === 0 ? 0 : proximoRef.current) + pagina.items.length;
      mudarProximo(proximo);
      // Página vazia antes do total (posts apagados no meio do caminho): trata como fim do feed em vez de travar.
      // O total da resposta pode ser de antes de um post publicado durante a espera: nunca fica abaixo da posição atual.
      setTotal(pagina.items.length === 0 ? proximo : Math.max(pagina.total, proximo));
      setErro(false);
      if (pagina.items.length > 0 && proximo < pagina.total) {
        const nova = { offset: proximo, geracao: minha, pagina: listarFeed(proximo, POR_PAGINA), pronta: false };
        // Uma falha aqui só aparece se a pessoa chegar a precisar desta página.
        nova.pagina.then(() => { nova.pronta = true; }, () => undefined);
        reserva.current = nova;
      }
    } catch {
      if (minha === geracao.current) setErro(true);
    } finally {
      if (minha !== geracao.current) return;
      buscando.current = false;
      setCarregando(false);
      setCarregandoMais(false);
    }
  }, [mudarProximo]);

  const atualizarProgresso = useCallback(() => {
    obterMeuProgresso().then(setProgresso).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!meuId()) {
      setLogado(false);
      setCarregando(false);
      return;
    }
    void buscar(0);
    atualizarProgresso();
    listarMatches()
      .then((m) => setPessoas(m.pode_te_ensinar.slice(0, PESSOAS_NA_LATERAL)))
      .catch(() => setPessoas([]));
    listarEmAlta()
      .then(setEmAlta)
      .catch(() => setEmAlta(null));
  }, [buscar, atualizarProgresso]);

  useEffect(() => {
    if (parametros.get("publicar") !== "1") return;
    setPedidoDeAbrir((n) => n + 1);
    roteador.replace(caminho, { scroll: false });
  }, [parametros, roteador, caminho]);

  const atualizar = useCallback(async () => {
    atualizarProgresso();
    await buscar(0);
  }, [buscar, atualizarProgresso]);

  const temMais = proximoOffset < total;

  const carregarMais = useCallback(() => {
    if (buscando.current) return;
    const guardada = reserva.current;
    // Com a página já guardada, ela aparece na hora: sem esqueleto nem aviso de carregando.
    const offset = proximoRef.current;
    if (!(guardada && guardada.offset === offset && guardada.pronta)) setCarregandoMais(true);
    void buscar(offset);
  }, [buscar]);

  // proximoOffset nas dependências recria o observador a cada página, para disparar de novo se a sentinela ainda estiver na margem.
  useEffect(() => {
    const alvo = sentinela.current;
    if (!alvo || !temMais || erro) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) carregarMais();
      },
      { rootMargin: ANTECIPAR_CARREGAMENTO },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [temMais, erro, carregarMais, proximoOffset]);

  function tentarDeNovo() {
    setCarregando(true);
    void buscar(0);
  }

  function aoPublicar(post: Post) {
    setItens((atuais) => [{ ...post, motivo: "meu" }, ...atuais.filter((i) => i.id !== post.id)]);
    setTotal((t) => t + 1);
    // O post novo entra no topo do feed no servidor e empurra os demais uma posição.
    mudarProximo(proximoRef.current + 1);
    if (erro && itens.length === 0) setErro(false);
    atualizarProgresso();
  }

  function aoApagar(id: number) {
    setItens((atuais) => atuais.filter((i) => i.id !== id));
    setTotal((t) => Math.max(0, t - 1));
    mudarProximo(proximoRef.current - 1);
    atualizarProgresso();
  }

  const carrossel = pessoas && pessoas.length > 0 ? <CarrosselPodeTeEnsinar pessoas={pessoas} /> : null;

  let conteudo: ReactNode;
  if (!logado) {
    conteudo = (
      <p className="text-sm leading-relaxed text-texto-2">
        Entre na sua conta para ver a Mesa.{" "}
        <Link className="font-medium text-marca-forte underline" href="/login">
          Entrar
        </Link>
      </p>
    );
  } else if (carregando) {
    conteudo = (
      <div className="divide-y divide-linha border-y border-linha" aria-label="Carregando o Diário">
        {[0, 1, 2].map((n) => (
          <div key={n} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-4">
            <div className="mt-1.5 h-3 w-9 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
            <div className="h-24 animate-pulse rounded-controle bg-superficie-2 motion-reduce:animate-none" />
          </div>
        ))}
      </div>
    );
  } else if (erro && itens.length === 0) {
    conteudo = (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-texto-2">
          Não consegui carregar o Diário. Confira se o backend está rodando e tente de novo.
        </p>
        <Botao variante="secundario" tamanho="sm" onClick={tentarDeNovo}>
          Tentar de novo
        </Botao>
      </div>
    );
  } else if (itens.length === 0) {
    conteudo = (
      <>
        <div className="space-y-3 border-y border-linha py-6">
          <p className="text-sm leading-relaxed text-texto-2">
            Seu Diário ainda está vazio. Publique o que estudou hoje, siga quem estuda o mesmo que você ou veja quem pode te ensinar.
          </p>
          <div className="flex flex-wrap gap-2">
            <BotaoLink href="/busca" variante="secundario" tamanho="sm">
              Buscar pessoas
            </BotaoLink>
            <BotaoLink href="/matches" variante="fantasma" tamanho="sm">
              Ver meus matches
            </BotaoLink>
          </div>
        </div>
        {carrossel}
      </>
    );
  } else {
    conteudo = (
      <>
        <ul className="divide-y divide-linha border-y border-linha">
          {itens.map((item, i) => (
            <Fragment key={item.id}>
              <li>
                <Revelar
                  atraso={i < tamanhoPrimeiraPagina ? Math.min(i, 6) * 40 : 0}
                  antecipacao={ANTECIPAR_ANIMACAO}
                >
                  <CartaoPost
                    post={item}
                    podeEnsinar={item.motivo === "pode_te_ensinar"}
                    rotulo={item.motivo === "descobrir" ? "Estuda o mesmo que você" : undefined}
                    aoApagar={aoApagar}
                  />
                </Revelar>
              </li>
              {carrossel && i === Math.min(CARROSSEL_DEPOIS_DO, itens.length) - 1 && <li className="py-5 lg:hidden">{carrossel}</li>}
            </Fragment>
          ))}
        </ul>
        {erro && (
          <div className="flex flex-col items-start gap-2 pt-4">
            <p className="text-sm text-texto-2">Não consegui carregar mais posts.</p>
            <Botao variante="secundario" tamanho="sm" onClick={carregarMais}>
              Tentar de novo
            </Botao>
          </div>
        )}
        {temMais && !erro && (
          <div ref={sentinela} aria-live="polite">
            {carregandoMais && (
              <>
                <EsqueletoPost />
                <span className="sr-only">Carregando mais posts…</span>
              </>
            )}
          </div>
        )}
        {!temMais && itens.length > MINIMO_PARA_AVISAR_FIM && (
          <p className="pt-4 font-mono text-xs text-texto-3">Fim do Diário.</p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[60rem] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="mx-auto w-full min-w-0 max-w-[37.5rem] space-y-6">
        <header className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-[2rem] font-bold leading-tight tracking-[-0.025em] text-texto">Mesa</h1>
            <time className="font-mono text-xs text-texto-3 numeros" dateTime={hoje ? dataLocal(hoje) : undefined}>
              {hoje ? HOJE.format(hoje).replace(/\./g, "") : null}
            </time>
          </div>
          {logado && emAlta && <MaisEstudadas habilidades={emAlta} />}
        </header>
        {logado && !carregando && <Composer aoPublicar={aoPublicar} pedidoDeAbrir={pedidoDeAbrir} />}
        {logado ? <PuxarParaAtualizar aoAtualizar={atualizar}>{conteudo}</PuxarParaAtualizar> : conteudo}
      </div>
      {logado && <ColunaDescoberta pessoas={pessoas} emAlta={emAlta} progresso={progresso} />}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={null}>
      <Feed />
    </Suspense>
  );
}
