"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { listarConversas, type Conversa } from "@/lib/api";
import { formatarQuando } from "@/lib/datas";
import { meuId } from "@/lib/sessao";
import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { Revelar } from "@/components/ui/Revelar";

export function ListaConversas({ ativa }: { ativa?: string }) {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null | undefined>(undefined);
  const [primeiraCarga, setPrimeiraCarga] = useState(true);

  const buscar = useCallback(async (inicial = false) => {
    if (!meuId()) {
      setUsuarioId(null);
      setCarregando(false);
      setErro(false);
      return;
    }
    setUsuarioId(meuId());
    try {
      const resposta = await listarConversas();
      setConversas(resposta.items);
      setErro(false);
      if (inicial) setPrimeiraCarga(false);
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void buscar(true);
    const intervalo = window.setInterval(() => {
      if (!document.hidden) void buscar();
    }, 5000);
    const aoVoltar = () => {
      if (!document.hidden) void buscar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [buscar]);

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Lista de conversas">
      <header className="shrink-0 border-b border-linha px-5 py-5">
        <h1 className="text-lg font-semibold tracking-tight text-texto">Mensagens</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {usuarioId === null ? (
          <div className="px-3 py-6 text-sm leading-relaxed text-texto-2">
            Entre na sua conta para ver suas mensagens. <Link className="font-medium text-marca-forte underline" href="/login">Entrar</Link>
          </div>
        ) : carregando ? (
          <div className="space-y-2 p-1" aria-label="Carregando conversas">
            {[0, 1, 2].map((item) => <div key={item} className="flex h-14 items-center gap-3 rounded-controle px-3"><span className="size-10 animate-pulse rounded-full bg-superficie-2 motion-reduce:animate-none" /><span className="h-3 flex-1 animate-pulse rounded-full bg-superficie-2 motion-reduce:animate-none" /></div>)}
          </div>
        ) : erro ? (
          <div className="space-y-3 px-3 py-6">
            <p className="text-sm leading-relaxed text-texto-2">Não consegui carregar suas conversas. Confira se o backend está rodando e tente de novo.</p>
            <Botao variante="secundario" tamanho="sm" onClick={() => { setCarregando(true); void buscar(true); }}>Tentar de novo</Botao>
          </div>
        ) : conversas.length === 0 ? (
          <div className="space-y-3 px-3 py-6">
            <p className="text-sm text-texto-2">Nenhuma conversa ainda.</p>
            <Link className="text-sm font-medium text-marca-forte underline" href="/matches">Ver meus matches</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5" aria-live="polite">
            {conversas.map((conversa, i) => {
              const ativo = conversa.com.username === ativa;
              return (
                <li key={conversa.com.username}>
                  <Revelar atraso={primeiraCarga ? Math.min(i, 6) * 40 : 0}>
                    <Link href={`/mensagens/${encodeURIComponent(conversa.com.username)}`} aria-current={ativo ? "page" : undefined} className={`flex min-h-14 items-center gap-3 rounded-controle px-3 py-2 transition-colors duration-[var(--rapido)] ease-saida hover:bg-superficie-2 ${ativo ? "bg-superficie-2" : ""}`}>
                      <Avatar nome={conversa.com.name} url={conversa.com.avatar_url} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0 truncate font-medium text-texto">{conversa.com.name}</span>
                          <span className="shrink-0 truncate text-xs text-texto-3">@{conversa.com.username}</span>
                          <time className="numeros shrink-0 text-xs text-texto-3" dateTime={conversa.em}>{formatarQuando(conversa.em)}</time>
                        </span>
                        <span className="block truncate text-sm text-texto-3">{conversa.ultima_de_mim ? "Você: " : ""}{conversa.ultima_mensagem}</span>
                      </span>
                    </Link>
                  </Revelar>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
