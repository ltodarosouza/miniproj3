"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { listarConversasComStatus, type ConversaComStatus, type NaoLidasMensagens } from "@/lib/mensagens";
import { trocasPendentesAvaliacao } from "@/lib/api";
import { EVENTO_AVALIACAO_ENVIADA } from "@/lib/avaliacoes";
import { formatarPreviaTroca, formatarQuando } from "@/lib/datas";
import { meuId } from "@/lib/sessao";
import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { SeloContador } from "@/components/ui/SeloContador";
import { Revelar } from "@/components/ui/Revelar";
import { ConviteAvisos } from "@/components/mensagens/ConviteAvisos";

export function ListaConversas({ ativa, naoLidas }: { ativa?: string; naoLidas: NaoLidasMensagens | null }) {
  const [conversas, setConversas] = useState<ConversaComStatus[]>([]);
  const [trocasParaAvaliar, setTrocasParaAvaliar] = useState<Set<string>>(() => new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null | undefined>(undefined);
  const [primeiraCarga, setPrimeiraCarga] = useState(true);
  const buscando = useRef(false);
  const pedidoPendentes = useRef(0);

  const buscarPendentes = useCallback(async () => {
    if (!meuId()) return;
    const pedido = ++pedidoPendentes.current;
    try {
      const resposta = await trocasPendentesAvaliacao();
      if (pedido !== pedidoPendentes.current) return;
      const id = meuId();
      setTrocasParaAvaliar(new Set(resposta.items.map((troca) => (
        troca.proposta_por.id === id ? troca.com.username : troca.proposta_por.username
      ))));
    } catch {
      // Mantém as pendências anteriores quando a consulta falha.
    }
  }, []);

  const buscar = useCallback(async (inicial = false) => {
    if (buscando.current) return;
    if (!meuId()) {
      setUsuarioId(null);
      setCarregando(false);
      setErro(false);
      return;
    }
    setUsuarioId(meuId());
    try {
      buscando.current = true;
      const respostaConversas = await listarConversasComStatus();
      setConversas(respostaConversas.items);
      setErro(false);
      if (inicial) setPrimeiraCarga(false);
    } catch {
      setErro(true);
    } finally {
      buscando.current = false;
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void buscar(true);
    void buscarPendentes();
    const intervalo = window.setInterval(() => {
      if (!document.hidden) {
        void buscar();
        void buscarPendentes();
      }
    }, 5000);
    const aoVoltar = () => {
      if (!document.hidden) {
        void buscar();
        void buscarPendentes();
      }
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [buscar, buscarPendentes]);

  useEffect(() => {
    const aoAvaliar = () => { void buscarPendentes(); };
    window.addEventListener(EVENTO_AVALIACAO_ENVIADA, aoAvaliar);
    return () => window.removeEventListener(EVENTO_AVALIACAO_ENVIADA, aoAvaliar);
  }, [buscarPendentes]);

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Lista de conversas">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-linha px-4">
        <h1 className="font-display text-lg font-semibold tracking-tight text-texto">Mensagens</h1>
        {usuarioId !== null && conversas.length > 0 && <span className="font-mono text-xs tabular-nums text-texto-3">{conversas.length}</span>}
      </header>
      {usuarioId !== null && conversas.length > 0 && <ConviteAvisos temConversas />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {usuarioId === null ? (
          <div className="px-4 py-6 text-sm leading-relaxed text-texto-2">
            Entre na sua conta para ver suas mensagens. <Link className="font-medium text-marca-forte underline" href="/login">Entrar</Link>
          </div>
        ) : carregando ? (
          <div aria-label="Carregando conversas">
            {[0, 1, 2].map((item) => <div key={item} className="flex h-16 items-center gap-3 border-b border-linha px-4"><span className="size-10 animate-pulse rounded-[4px] bg-superficie-2 motion-reduce:animate-none" /><span className="flex flex-1 flex-col gap-2"><span className="h-2.5 w-2/5 animate-pulse rounded-[2px] bg-superficie-2 motion-reduce:animate-none" /><span className="h-2.5 w-4/5 animate-pulse rounded-[2px] bg-superficie-2 motion-reduce:animate-none" /></span></div>)}
          </div>
        ) : erro ? (
          <div className="space-y-3 px-4 py-6">
            <p className="text-sm leading-relaxed text-texto-2">Não consegui carregar suas conversas. Confira se o backend está rodando e tente de novo.</p>
            <Botao variante="secundario" tamanho="sm" onClick={() => { setCarregando(true); void buscar(true); }}>Tentar de novo</Botao>
          </div>
        ) : conversas.length === 0 ? (
          <div className="space-y-3 px-4 py-6">
            <p className="text-sm text-texto-2">Nenhuma conversa ainda.</p>
            <Link className="text-sm font-medium text-marca-forte underline" href="/matches">Ver meus matches</Link>
          </div>
        ) : (
          <ul>
            {conversas.map((conversa, i) => {
              const ativo = conversa.com.username === ativa;
              const temTrocaParaAvaliar = trocasParaAvaliar.has(conversa.com.username);
              const quantidade = ativo ? 0 : conversa.nao_lidas ?? naoLidas?.por_conversa[conversa.com.username] ?? 0;
              const previa = conversa.ultimo_evento === "troca_proposta" && conversa.troca_data_hora ? formatarPreviaTroca(conversa.troca_data_hora) : conversa.ultimo_evento === "troca_confirmada" ? "Troca confirmada" : conversa.ultimo_evento === "troca_recusada" ? "Troca recusada" : `${conversa.ultima_de_mim ? "Você: " : ""}${conversa.ultima_mensagem}`;
              return (
                <li key={conversa.com.username} className="border-b border-linha">
                  <Revelar atraso={primeiraCarga ? Math.min(i, 6) * 40 : 0}>
                    <Link href={`/mensagens/${encodeURIComponent(conversa.com.username)}`} aria-label={`${conversa.com.name}${quantidade ? `, ${quantidade} mensagens não lidas` : ""}${temTrocaParaAvaliar ? ", troca para avaliar" : ""}`} aria-current={ativo ? "page" : undefined} className={`flex min-h-16 items-center gap-3 px-4 py-3 transition-colors duration-[var(--rapido)] ease-saida hover:bg-superficie-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-marca ${ativo ? "bg-superficie-2 shadow-[inset_2px_0_0_var(--marca)]" : ""}`}>
                      <Avatar nome={conversa.com.name} url={conversa.com.avatar_url} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`min-w-0 truncate text-sm text-texto ${quantidade ? "font-semibold" : "font-medium"}`}>{conversa.com.name}</span>
                          <time className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-texto-3" dateTime={conversa.em}>{formatarQuando(conversa.em)}</time>
                        </span>
                        <span className={`block truncate text-[0.8125rem] ${quantidade ? "text-texto" : "text-texto-2"}`}>{previa}</span>
                        {temTrocaParaAvaliar && <span className="flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-marca-forte"><span aria-hidden="true" className="size-1.5 rounded-full bg-marca" />Avaliar troca</span>}
                      </span>
                      <SeloContador total={quantidade} />
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
