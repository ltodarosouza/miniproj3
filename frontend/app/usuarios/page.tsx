"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { Campo } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { Revelar } from "@/components/ui/Revelar";
import { ErroApi, buscarUsuarios, type User } from "@/lib/api";
import { meuId } from "@/lib/sessao";

const POR_PAGINA = 20;

export default function EncontrarPessoasPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
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
      setTotal(pagina.total - (offset === 0 && pagina.items.some((usuario) => usuario.id === idMeuUsuario) ? 1 : 0));
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
        <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-texto">
          Encontrar pessoas
        </h1>
        <p className="mt-1 text-sm text-texto-2">
          Siga quem estuda o mesmo que você para ver a rotina no feed.
        </p>
      </header>

      <BotaoLink variante="secundario" tamanho="sm" href="/matches">
        <Icone nome="troca" />
        Ver quem pode te ensinar
      </BotaoLink>

      <Campo
        rotulo="Buscar"
        type="search"
        placeholder="Nome ou @usuário"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
      />

      {logado === false && (
        <p className="text-sm leading-relaxed text-texto-2">
          Entre na sua conta para encontrar pessoas.{" "}
          <Link href="/login" className={linkTexto}>Entrar</Link>
        </p>
      )}

      {logado && carregando && (
        <div role="status" aria-busy="true">
          <span className="sr-only">Carregando pessoas</span>
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-cartao bg-superficie-2 motion-reduce:animate-none" />
            ))}
          </div>
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
          <ul className="space-y-3">
            {usuarios.map((usuario, i) => (
              <li key={usuario.id}>
                <Revelar atraso={Math.min(i, 6) * 40}>
                  <Cartao interativo className="p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Link href={`/perfil/${encodeURIComponent(usuario.username)}`} aria-label={`Ver perfil de ${usuario.name}`} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca">
                        <Avatar nome={usuario.name} url={usuario.avatar_url} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/perfil/${encodeURIComponent(usuario.username)}`} className="block truncate font-medium text-texto hover:underline">
                          {usuario.name}
                        </Link>
                        <p className="truncate text-sm text-texto-3">@{usuario.username}</p>
                        {usuario.bio && <p className="mt-1 line-clamp-2 text-sm text-texto-2">{usuario.bio}</p>}
                      </div>
                      <BotaoSeguir username={usuario.username} tamanho="sm" />
                    </div>
                  </Cartao>
                </Revelar>
              </li>
            ))}
          </ul>
          {usuarios.length < total && (
            <div className="flex justify-center">
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
