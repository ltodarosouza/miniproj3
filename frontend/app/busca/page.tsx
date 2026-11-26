"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { EmAlta } from "@/components/feed/EmAlta";
import { ListaPodeTeEnsinar } from "@/components/feed/PodeTeEnsinar";
import { CartaoPost } from "@/components/posts/CartaoPost";
import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { listarMatches, type Match } from "@/lib/api";
import { buscar, type ResultadoBusca, type TipoBusca } from "@/lib/busca";
import { listarEmAlta, type HabilidadeEmAlta } from "@/lib/posts";
import { meuId } from "@/lib/sessao";

const ABAS: { tipo: TipoBusca; rotulo: string }[] = [
  { tipo: "pessoas", rotulo: "Pessoas" },
  { tipo: "posts", rotulo: "Posts" },
  { tipo: "habilidades", rotulo: "Habilidades" },
];
const POR_PAGINA = 20;
const ESPERA_MS = 300;

function ehTipo(valor: string | null): valor is TipoBusca {
  return valor === "pessoas" || valor === "posts" || valor === "habilidades";
}

function Recomendados() {
  const [pessoas, setPessoas] = useState<Match[] | null>(null);
  const [emAlta, setEmAlta] = useState<HabilidadeEmAlta[] | null>(null);

  useEffect(() => {
    listarMatches()
      .then((m) => setPessoas(m.pode_te_ensinar.slice(0, 6)))
      .catch(() => setPessoas([]));
    listarEmAlta(8)
      .then(setEmAlta)
      .catch(() => setEmAlta([]));
  }, []);

  return (
    <div className="space-y-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
      <section>
        <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-texto-3">01 · Pode te ensinar</h2>
        <div className="border-t border-linha pt-3">
          {pessoas === null ? (
            <p className="text-sm text-texto-3">Carregando…</p>
          ) : pessoas.length ? (
            <ListaPodeTeEnsinar pessoas={pessoas} />
          ) : (
            <p className="text-sm text-texto-3">
              Marque no seu perfil o que quer aprender para ver quem pode te ensinar.
            </p>
          )}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.08em] text-texto-3">02 · Mais estudadas</h2>
        <div className="border-t border-linha pt-3">
          {emAlta === null ? <p className="text-sm text-texto-3">Carregando…</p> : <EmAlta habilidades={emAlta} />}
        </div>
      </section>
    </div>
  );
}

function Resultados({ resultado, aoApagar }: { resultado: ResultadoBusca; aoApagar: (id: number) => void }) {
  if (resultado.total === 0) {
    return <p className="py-6 text-sm text-texto-2">Nada encontrado. Tente outra palavra.</p>;
  }
  if (resultado.tipo === "pessoas") {
    return (
      <ul className="divide-y divide-linha border-y border-linha">
        {resultado.pessoas.map((p) => (
          <li key={p.id}>
            <Link
              href={`/perfil/${encodeURIComponent(p.username)}`}
              className="flex items-center gap-3 px-2 py-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
            >
              <Avatar nome={p.name} url={p.avatar_url} tamanho="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-texto">{p.name}</span>
                <span className="block truncate text-xs text-texto-2">
                  <span className="font-mono text-texto-3">@{p.username}</span>
                  {p.bio && ` · ${p.bio}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }
  if (resultado.tipo === "posts") {
    return (
      <ul className="divide-y divide-linha border-y border-linha">
        {resultado.posts.map((post) => (
          <li key={post.id} className="py-4">
            <CartaoPost post={post} aoApagar={aoApagar} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-linha border-y border-linha">
      {resultado.habilidades.map((h) => (
        <li key={h.id}>
          <Link
            href={`/busca/habilidades/${h.id}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 px-2 py-3 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
          >
            <span className="min-w-0 whitespace-normal text-sm font-medium text-texto [overflow-wrap:anywhere]">{h.nome}</span>
            <span className="font-mono numeros text-xs text-texto-3">
              {h.sabem} {h.sabem === 1 ? "sabe" : "sabem"} · {h.querem} {h.querem === 1 ? "quer" : "querem"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Busca() {
  const roteador = useRouter();
  const parametros = useSearchParams();
  const [termo, setTermo] = useState(parametros.get("q") ?? "");
  const tipoDaUrl = parametros.get("tipo");
  const [tipo, setTipo] = useState<TipoBusca>(ehTipo(tipoDaUrl) ? tipoDaUrl : "pessoas");
  const [resultadoSalvo, setResultadoSalvo] = useState<{ consulta: object; resultado: ResultadoBusca } | null>(null);
  const [consultaComErro, setConsultaComErro] = useState<object | null>(null);
  const [maisSalvo, setMaisSalvo] = useState<object | null>(null);
  const [logado, setLogado] = useState(true);
  const campo = useRef<HTMLInputElement>(null);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const consultaAtiva = useRef<object | null>(null);
  const consultasEmPaginacao = useRef(new Set<object>());
  const consulta = useMemo(() => ({ termo: termo.trim(), tipo }), [termo.trim(), tipo]);
  const resultado = resultadoSalvo?.consulta === consulta ? resultadoSalvo.resultado : null;
  const erro = consultaComErro === consulta;
  const carregando = Boolean(consulta.termo && logado && !resultado && !erro);
  const carregandoMais = maisSalvo === consulta;

  useEffect(() => {
    setLogado(Boolean(meuId()));
    campo.current?.focus();
  }, []);

  useEffect(() => {
    const aoPressionar = (evento: KeyboardEvent) => {
      const alvo = evento.target;
      if (
        evento.key !== "/" || evento.ctrlKey || evento.metaKey || evento.altKey ||
        alvo instanceof HTMLElement && (alvo.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName))
      ) return;
      if (!campo.current) return;
      evento.preventDefault();
      campo.current.focus();
      campo.current.select();
    };
    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, []);

  // Voltar/Avançar mudam a URL: o campo e a aba acompanham.
  useEffect(() => {
    const q = parametros.get("q") ?? "";
    const t = parametros.get("tipo");
    setTermo((atual) => (atual.trim() === q.trim() ? atual : q));
    setTipo(ehTipo(t) ? t : "pessoas");
  }, [parametros]);

  useEffect(() => {
    const limpo = consulta.termo;
    const parametrosUrl = new URLSearchParams();
    if (limpo) parametrosUrl.set("q", limpo);
    if (consulta.tipo !== "pessoas") parametrosUrl.set("tipo", consulta.tipo);
    const destino = parametrosUrl.size ? `/busca?${parametrosUrl}` : "/busca";
    const atualizarUrl = () => {
      if (`${location.pathname}${location.search}` !== destino) roteador.replace(destino, { scroll: false });
    };

    if (!limpo || !logado) {
      atualizarUrl();
      return;
    }
    consultaAtiva.current = consulta;
    const espera = setTimeout(() => {
      atualizarUrl();
      buscar(limpo, consulta.tipo, 0, POR_PAGINA)
        .then((r) => {
          if (consultaAtiva.current !== consulta) return;
          setResultadoSalvo({ consulta, resultado: r });
        })
        .catch(() => {
          if (consultaAtiva.current === consulta) setConsultaComErro(consulta);
        });
    }, ESPERA_MS);
    return () => {
      consultaAtiva.current = null;
      clearTimeout(espera);
    };
  }, [consulta, logado, roteador]);

  async function carregarMais() {
    const atual = resultadoSalvo;
    if (!resultado || !atual || atual.consulta !== consulta || consultasEmPaginacao.current.has(consulta)) return;
    const contexto = consulta;
    consultasEmPaginacao.current.add(contexto);
    setMaisSalvo(contexto);
    setConsultaComErro(null);
    try {
      const mais = await buscar(contexto.termo, contexto.tipo, resultado[resultado.tipo].length, POR_PAGINA);
      setResultadoSalvo((salvo) =>
        salvo?.consulta === contexto ? {
          consulta: contexto,
          resultado: {
            ...mais,
            pessoas: [...salvo.resultado.pessoas, ...mais.pessoas],
            posts: [...salvo.resultado.posts, ...mais.posts],
            habilidades: [...salvo.resultado.habilidades, ...mais.habilidades],
          },
        } : salvo,
      );
    } catch {
      if (consultaAtiva.current === contexto) setConsultaComErro(contexto);
    } finally {
      consultasEmPaginacao.current.delete(contexto);
      setMaisSalvo((salvo) => salvo === contexto ? null : salvo);
    }
  }

  if (!logado) {
    return (
      <p className="text-sm text-texto-2">
        Entre na sua conta para buscar.{" "}
        <Link className="font-medium text-marca-forte underline" href="/login">
          Entrar
        </Link>
      </p>
    );
  }

  const mostrados = resultado ? resultado[resultado.tipo].length : 0;

  function navegarAbas(evento: React.KeyboardEvent<HTMLDivElement>) {
    const indiceAtual = ABAS.findIndex((aba) => aba.tipo === tipo);
    let novoIndice: number;
    if (evento.key === "ArrowRight") novoIndice = (indiceAtual + 1) % ABAS.length;
    else if (evento.key === "ArrowLeft") novoIndice = (indiceAtual - 1 + ABAS.length) % ABAS.length;
    else if (evento.key === "Home") novoIndice = 0;
    else if (evento.key === "End") novoIndice = ABAS.length - 1;
    else return;
    evento.preventDefault();
    setTipo(ABAS[novoIndice].tipo);
    abas.current[novoIndice]?.focus();
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <label htmlFor="campo-busca" className="sr-only">
          Buscar pessoas, posts ou habilidades
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-3">
          <Icone nome="busca" tamanho={20} />
        </span>
        <input
          ref={campo}
          id="campo-busca"
          type="search"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          placeholder="Buscar pessoas, posts ou habilidades"
          maxLength={100}
          className="h-14 w-full rounded-controle border border-linha-forte bg-superficie pl-12 pr-4 text-base sm:pr-14 text-texto placeholder:text-texto-3 focus:border-marca focus:outline-none focus:ring-2 focus:ring-marca/40 sm:text-lg"
        />
        {!termo && <kbd aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 hidden h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-[2px] border border-linha px-1.5 font-mono text-xs text-texto-3 sm:inline-flex">/</kbd>}
      </div>

      {termo.trim() ? (
        <>
          <div role="tablist" aria-label="Tipo de resultado" onKeyDown={navegarAbas} className="flex gap-1 border-b border-linha">
            {ABAS.map((aba) => (
              <button
                key={aba.tipo}
                type="button"
                role="tab"
                ref={(el) => { abas.current[ABAS.indexOf(aba)] = el; }}
                id={`aba-busca-${aba.tipo}`}
                aria-controls="painel-busca"
                aria-selected={tipo === aba.tipo}
                tabIndex={tipo === aba.tipo ? 0 : -1}
                onClick={() => setTipo(aba.tipo)}
                className={`-mb-px mr-5 border-b-2 px-1 py-2.5 text-sm transition-colors duration-[var(--rapido)] motion-reduce:transition-none ${tipo === aba.tipo ? "border-marca text-texto font-medium" : "border-transparent text-texto-3 hover:text-texto"}`}
              >
                {aba.rotulo}{resultado?.tipo === aba.tipo && <> <span className="font-mono numeros text-xs text-texto-3">{resultado.total}</span></>}
              </button>
            ))}
          </div>
          <div role="tabpanel" id="painel-busca" aria-labelledby={`aba-busca-${tipo}`} aria-busy={carregando} className="space-y-4">
            {erro && !resultado ? (
              <p className="text-sm text-texto-2">Não deu para buscar agora. Tente de novo.</p>
            ) : carregando && !resultado ? (
              <p className="text-sm text-texto-3" role="status">
                Buscando…
              </p>
            ) : resultado ? (
              <div className={carregando ? "opacity-60 transition-opacity" : undefined}>
                <Resultados
                  resultado={resultado}
                  aoApagar={(id) => setResultadoSalvo((salvo) => salvo?.consulta === consulta
                    ? { consulta, resultado: { ...salvo.resultado, posts: salvo.resultado.posts.filter((p) => p.id !== id), total: Math.max(0, salvo.resultado.total - 1) } }
                    : salvo)}
                />
              </div>
            ) : null}
            {erro && resultado && <p className="text-sm text-texto-2">Não deu para carregar mais. Tente de novo.</p>}
            {resultado && mostrados < resultado.total && !carregando && (
              <div className="flex justify-start">
                <Botao variante="secundario" carregando={carregandoMais} onClick={carregarMais}>
                  Ver mais
                </Botao>
              </div>
            )}
          </div>
        </>
      ) : (
        <Recomendados />
      )}
    </div>
  );
}

export default function PaginaBusca() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">Buscar</h1>
        <p className="mt-1 text-sm text-texto-2">Encontre pessoas, posts e habilidades.</p>
      </header>
      <Suspense fallback={null}>
        <Busca />
      </Suspense>
    </div>
  );
}
