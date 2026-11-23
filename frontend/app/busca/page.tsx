"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

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
  { tipo: "posts", rotulo: "Publicações" },
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
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-cartao border border-linha bg-superficie p-4">
        <h2 className="mb-3 text-sm font-semibold text-texto">Pode te ensinar</h2>
        {pessoas === null ? (
          <p className="text-sm text-texto-3">Carregando…</p>
        ) : pessoas.length ? (
          <ListaPodeTeEnsinar pessoas={pessoas} />
        ) : (
          <p className="text-sm text-texto-3">
            Marque no seu perfil o que quer aprender para ver quem pode te ensinar.
          </p>
        )}
      </section>
      <section className="rounded-cartao border border-linha bg-superficie p-4">
        <h2 className="mb-3 text-sm font-semibold text-texto">Em alta esta semana</h2>
        {emAlta === null ? <p className="text-sm text-texto-3">Carregando…</p> : <EmAlta habilidades={emAlta} />}
      </section>
    </div>
  );
}

function Resultados({ resultado, aoApagar }: { resultado: ResultadoBusca; aoApagar: (id: number) => void }) {
  if (resultado.total === 0) {
    return <p className="py-6 text-center text-sm text-texto-2">Nada encontrado. Tente outra palavra.</p>;
  }
  if (resultado.tipo === "pessoas") {
    return (
      <ul className="divide-y divide-linha rounded-cartao border border-linha bg-superficie">
        {resultado.pessoas.map((p) => (
          <li key={p.id}>
            <Link
              href={`/perfil/${encodeURIComponent(p.username)}`}
              className="flex items-center gap-3 p-4 transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
            >
              <Avatar nome={p.name} url={p.avatar_url} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-texto">{p.name}</span>
                <span className="block truncate text-sm text-texto-3">
                  @{p.username}
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
      <ul className="space-y-4">
        {resultado.posts.map((post) => (
          <li key={post.id}>
            <CartaoPost post={post} aoApagar={aoApagar} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {resultado.habilidades.map((h) => (
        <li key={h.id}>
          <Link
            href={`/busca/habilidades/${h.id}`}
            className="block rounded-cartao border border-linha bg-superficie p-4 transition-colors duration-[var(--rapido)] hover:border-marca motion-reduce:transition-none"
          >
            <span className="block font-medium text-texto">{h.nome}</span>
            <span className="numeros text-sm text-texto-3">
              {h.sabem} {h.sabem === 1 ? "sabe" : "sabem"} · {h.querem} {h.querem === 1 ? "quer" : "querem"} aprender
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
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [logado, setLogado] = useState(true);
  const campo = useRef<HTMLInputElement>(null);
  const pedido = useRef(0);

  useEffect(() => {
    setLogado(Boolean(meuId()));
    campo.current?.focus();
  }, []);

  // Voltar/Avançar mudam a URL: o campo e a aba acompanham.
  useEffect(() => {
    const q = parametros.get("q") ?? "";
    const t = parametros.get("tipo");
    setTermo((atual) => (atual.trim() === q.trim() ? atual : q));
    setTipo(ehTipo(t) ? t : "pessoas");
  }, [parametros]);

  useEffect(() => {
    const limpo = termo.trim();
    const consulta = new URLSearchParams();
    if (limpo) consulta.set("q", limpo);
    if (tipo !== "pessoas") consulta.set("tipo", tipo);
    const destino = consulta.size ? `/busca?${consulta}` : "/busca";
    const atualizarUrl = () => {
      if (`${location.pathname}${location.search}` !== destino) roteador.replace(destino, { scroll: false });
    };

    if (!limpo || !logado) {
      atualizarUrl();
      setResultado(null);
      setCarregando(false);
      return;
    }
    const meu = ++pedido.current;
    setCarregando(true);
    const espera = setTimeout(() => {
      atualizarUrl();
      buscar(limpo, tipo, 0, POR_PAGINA)
        .then((r) => {
          if (meu !== pedido.current) return;
          setResultado(r);
          setErro(false);
        })
        .catch(() => meu === pedido.current && setErro(true))
        .finally(() => meu === pedido.current && setCarregando(false));
    }, ESPERA_MS);
    return () => clearTimeout(espera);
  }, [termo, tipo, logado, roteador]);

  async function carregarMais() {
    if (!resultado) return;
    const meu = pedido.current;
    setCarregandoMais(true);
    try {
      const mais = await buscar(termo.trim(), resultado.tipo, resultado[resultado.tipo].length, POR_PAGINA);
      if (meu !== pedido.current) return;
      setResultado((atual) =>
        atual && {
          ...mais,
          pessoas: [...atual.pessoas, ...mais.pessoas],
          posts: [...atual.posts, ...mais.posts],
          habilidades: [...atual.habilidades, ...mais.habilidades],
        },
      );
    } catch {
      setErro(true);
    } finally {
      setCarregandoMais(false);
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

  return (
    <div className="space-y-5">
      <div className="relative">
        <label htmlFor="campo-busca" className="sr-only">
          Buscar pessoas, publicações e habilidades
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-texto-3">
          <Icone nome="busca" tamanho={18} />
        </span>
        <input
          ref={campo}
          id="campo-busca"
          type="search"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          placeholder="Buscar pessoas, publicações, habilidades"
          maxLength={100}
          className="h-12 w-full rounded-full border border-linha bg-superficie pl-11 pr-4 text-base text-texto placeholder:text-texto-3 focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none"
        />
      </div>

      {termo.trim() ? (
        <>
          <div role="tablist" aria-label="Tipo de resultado" className="flex gap-1 border-b border-linha">
            {ABAS.map((aba) => (
              <button
                key={aba.tipo}
                type="button"
                role="tab"
                aria-selected={tipo === aba.tipo}
                onClick={() => setTipo(aba.tipo)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--rapido)] motion-reduce:transition-none ${tipo === aba.tipo ? "border-marca text-texto" : "border-transparent text-texto-3 hover:text-texto"}`}
              >
                {aba.rotulo}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-busy={carregando} className="space-y-4">
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
                  aoApagar={(id) =>
                    setResultado((atual) =>
                      atual && { ...atual, posts: atual.posts.filter((p) => p.id !== id), total: Math.max(0, atual.total - 1) },
                    )
                  }
                />
              </div>
            ) : null}
            {resultado && mostrados < resultado.total && !carregando && (
              <div className="flex justify-center">
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
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">Buscar</h1>
        <p className="mt-1 text-sm text-texto-2">Encontre pessoas, publicações e habilidades.</p>
      </header>
      <Suspense fallback={null}>
        <Busca />
      </Suspense>
    </div>
  );
}
