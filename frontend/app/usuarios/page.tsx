"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Campo } from "@/components/ui/Campo";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { ErroApi, buscarUsuarios, type User } from "@/lib/api";
import type { HabilidadePerfil } from "@/lib/perfil";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 20;
type UsuarioComHabilidades = User & { habilidades?: HabilidadePerfil[] };

export default function EncontrarPessoasPage() {
  const [usuarios, setUsuarios] = useState<UsuarioComHabilidades[]>([]);
  const [total, setTotal] = useState(0);
  const [proximoOffset, setProximoOffset] = useState(0);
  const [termo, setTermo] = useState("");
  const [busca, setBusca] = useState("");
  const [idMeuUsuario, setIdMeuUsuario] = useState<number | null>(null);
  const [logado, setLogado] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const requisicao = useRef(0);

  useEffect(() => {
    const id = meuId();
    setIdMeuUsuario(id);
    setLogado(id !== null);
    setCarregando(id !== null);
  }, []);

  const carregar = useCallback(async (filtro: string, offset: number, mais = false) => {
    const atual = ++requisicao.current;
    if (mais) setCarregandoMais(true);
    else setCarregando(true);
    setErro(null);
    try {
      const pagina = await buscarUsuarios(filtro, offset, POR_PAGINA);
      if (atual !== requisicao.current) return;
      setUsuarios((anteriores) => {
        const novos = pagina.items.filter((usuario) => usuario.id !== idMeuUsuario);
        if (offset === 0) return novos;
        const ids = new Set(anteriores.map((usuario) => usuario.id));
        return [...anteriores, ...novos.filter((usuario) => !ids.has(usuario.id))];
      });
      setTotal(pagina.total);
      setProximoOffset(pagina.offset + pagina.items.length);
    } catch (falha) {
      if (atual === requisicao.current) {
        setErro(falha instanceof ErroApi ? falha.message : "Não consegui buscar pessoas. Confira sua conexão e tente de novo.");
      }
    } finally {
      if (atual === requisicao.current) {
        setCarregando(false);
        setCarregandoMais(false);
      }
    }
  }, [idMeuUsuario]);

  useEffect(() => {
    if (logado !== true) return;
    requisicao.current += 1;
    setCarregando(true);
    setCarregandoMais(false);
    const temporizador = window.setTimeout(() => {
      setBusca(termo.trim());
      void carregar(termo, 0);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [termo, logado, carregar]);

  function tentarDeNovo() {
    void carregar(busca, 0);
  }

  function carregarMais() {
    void carregar(busca, proximoOffset, true);
  }

  const linkTexto = "font-medium text-marca-forte underline underline-offset-2";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Encontrar pessoas
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Siga quem estuda o mesmo que você para ver a rotina no feed.
        </p>
      </header>

      {logado !== false && (
        <div className="space-y-4">
          <Campo
            rotulo="Buscar"
            type="search"
            placeholder="Nome ou @usuário"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
          />
        </div>
      )}

      {logado === false && (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para encontrar pessoas.{" "}
          <Link href="/login" className={linkTexto}>Entrar</Link>
        </p>
      )}

      {logado && (
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-texto-3">
            01 · Pessoas · <span className="numeros">{usuarios.length} carregadas</span>
          </p>
          <Link href="/matches" className="shrink-0 text-sm font-medium text-marca-forte hover:underline">
            Ver seus pares →
          </Link>
        </div>
      )}

      {logado && carregando && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Carregando pessoas</span>
          <ul className="divide-y divide-linha border-y border-linha" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="size-10 shrink-0 animate-pulse bg-superficie-2 motion-reduce:animate-none" />
                <span className="min-w-0 flex-1 space-y-2">
                  <span className="block h-3 w-2/5 animate-pulse bg-superficie-2 motion-reduce:animate-none" />
                  <span className="block h-3 w-3/5 animate-pulse bg-superficie-2 motion-reduce:animate-none" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {logado && !carregando && erro && (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-texto-2">{erro}</p>
          <Botao variante="secundario" tamanho="sm" onClick={tentarDeNovo}>Tentar de novo</Botao>
        </div>
      )}

      {logado && !carregando && !erro && usuarios.length === 0 && (
        <p className="text-sm text-texto-2">
          {busca ? `Ninguém encontrado para “${busca}”.` : "Ainda não tem ninguém por aqui."}
        </p>
      )}

      {logado && !carregando && usuarios.length > 0 && (
        <>
          <ul className="divide-y divide-linha border-y border-linha">
            {usuarios.map((usuario) => (
              <li key={usuario.id} className="flex min-w-0 items-center gap-3 py-3">
                <Link href={`/perfil/${encodeURIComponent(usuario.username)}`} aria-label={`Ver perfil de ${usuario.name}`} className="rounded-controle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca">
                  <Avatar nome={usuario.name} url={usuario.avatar_url} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/perfil/${encodeURIComponent(usuario.username)}`} className="block truncate text-sm font-medium text-texto hover:underline">
                    {usuario.name}
                  </Link>
                  <p className="truncate font-mono text-xs text-texto-3">@{usuario.username}</p>
                  {usuario.habilidades?.length ? (
                    <ul className="mt-1 flex min-w-0 flex-wrap gap-1" aria-label="Habilidades públicas">
                      {usuario.habilidades.map((habilidade) => (
                        <li key={`${habilidade.tipo}/${habilidade.id}`} className="min-w-0 max-w-full [&>span]:h-auto [&>span]:min-h-6 [&>span]:max-w-full [&>span]:[overflow-wrap:anywhere]">
                          <TagHabilidade nome={habilidade.nome} tipo={habilidade.tipo} nivel={habilidade.nivel} />
                        </li>
                      ))}
                    </ul>
                  ) : usuario.bio ? (
                    <p className="truncate text-sm text-texto-2">{usuario.bio}</p>
                  ) : null}
                </div>
                <span className="shrink-0">
                  <BotaoSeguir username={usuario.username} tamanho="sm" />
                </span>
              </li>
            ))}
          </ul>
          {proximoOffset < total && (
            <div className="flex justify-start">
              <Botao variante="secundario" carregando={carregandoMais} onClick={carregarMais}>
                Carregar mais
              </Botao>
            </div>
          )}
        </>
      )}
    </div>
  );
}
