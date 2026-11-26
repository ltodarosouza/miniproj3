"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { Botao } from "@/components/ui/Botao";
import { AreaTexto } from "@/components/ui/Campo";
import { Cartao } from "@/components/ui/Cartao";
import { Estrelas } from "@/components/ui/Estrelas";
import { Icone } from "@/components/ui/Icone";
import { avaliarTroca, trocasPendentesAvaliacao, type Troca } from "@/lib/api";
import { formatarDataHora } from "@/lib/datas";
import { meuId } from "@/lib/sessao";

const LEGENDAS = ["", "Não rolou", "Poderia ser melhor", "Foi ok", "Foi muito bom", "Aprendi demais!"];
const CHAVE_ADIADAS = "avaliacoes_adiadas";

export function AvisoAvaliacao() {
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [adiadas, setAdiadas] = useState<number[]>([]);
  const [estrelas, setEstrelas] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    setUsuarioId(meuId());
  }, []);

  const buscar = useCallback(async () => {
    if (usuarioId === null || document.hidden) return;
    try {
      const resposta = await trocasPendentesAvaliacao();
      setTrocas(resposta.items);
    } catch {}
  }, [usuarioId]);

  useEffect(() => {
    if (usuarioId === null) return;
    try {
      const salvas = JSON.parse(sessionStorage.getItem(CHAVE_ADIADAS) ?? "[]");
      if (Array.isArray(salvas)) setAdiadas(salvas.filter((id): id is number => typeof id === "number"));
    } catch {}
    void buscar();
    const intervalo = window.setInterval(() => void buscar(), 120000);
    const aoVisibilidade = () => {
      if (!document.hidden) void buscar();
    };
    document.addEventListener("visibilitychange", aoVisibilidade);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVisibilidade);
    };
  }, [buscar, usuarioId]);

  const troca = useMemo(() => trocas.find((item) => !adiadas.includes(item.id)) ?? null, [adiadas, trocas]);
  const outraPessoa = troca ? (troca.proposta_por.id === usuarioId ? troca.com : troca.proposta_por) : null;
  const nome = outraPessoa?.name ?? "essa pessoa";
  const primeiroNome = nome.split(" ")[0];

  useEffect(() => {
    setEstrelas(0);
    setFeedback("");
    setErro("");
    setSucesso(false);
    setVisivel(false);
    if (troca) requestAnimationFrame(() => setVisivel(true));
  }, [troca?.id]);

  function adiar() {
    if (!troca) return;
    const novas = [...new Set([...adiadas, troca.id])];
    setAdiadas(novas);
    try {
      sessionStorage.setItem(CHAVE_ADIADAS, JSON.stringify(novas));
    } catch {}
    setTrocas((atuais) => [...atuais]);
  }

  async function enviar() {
    if (!troca || estrelas === 0) return;
    setCarregando(true);
    setErro("");
    try {
      await avaliarTroca(troca.id, estrelas, feedback);
      setSucesso(true);
      window.setTimeout(() => {
        setTrocas((atuais) => atuais.filter((item) => item.id !== troca.id));
      }, 2500);
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : "Não foi possível enviar sua avaliação.";
      if (mensagem.toLowerCase().includes("já avaliou")) {
        setTrocas((atuais) => atuais.filter((item) => item.id !== troca.id));
      } else {
        setErro(mensagem);
      }
    } finally {
      setCarregando(false);
    }
  }

  if (usuarioId === null || !troca || !outraPessoa) return null;

  return (
    <div className={`fixed inset-x-3 bottom-[calc(0.75rem+var(--altura-barra-inferior))] z-50 transition-[opacity,translate] duration-[var(--lento)] ease-saida motion-reduce:transition-none md:inset-x-auto md:right-6 md:bottom-[calc(1.5rem+var(--altura-barra-inferior))] md:w-[22rem] ${visivel ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
      <Cartao role="dialog" aria-labelledby="titulo-avaliacao" className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[6px] p-0 shadow-alta">
        {sucesso ? (
          <div className="flex items-start gap-3 p-4" aria-live="polite">
            <Icone nome="confirmar" tamanho={22} className="shrink-0 text-sucesso" />
            <p className="text-sm leading-relaxed text-texto">Obrigado! Sua avaliação ajuda outras pessoas a escolherem com quem aprender.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-linha px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-texto-3 tabular-nums">Ordem #{troca.id} · concluída</span>
              <Botao type="button" variante="fantasma" tamanho="sm" className="px-2" aria-label="Avaliar depois" onClick={adiar}>
                <Icone nome="fechar" tamanho={18} />
              </Botao>
            </div>
            <div className="flex items-start gap-3 px-4 pt-4">
              <Avatar nome={nome} url={outraPessoa.avatar_url} />
              <div className="min-w-0 flex-1">
                <h2 id="titulo-avaliacao" className="font-semibold tracking-[-0.01em] text-texto">Como foi a troca com {primeiroNome}?</h2>
                <p className="mt-1 font-mono text-xs tabular-nums text-texto-2">{formatarDataHora(troca.data_hora)}</p>
              </div>
            </div>
            {(troca.habilidade_ensino || troca.habilidade_aprendo) && (
              <div className="mx-4 mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-y border-linha py-2 text-sm">
                <div className="min-w-0">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-texto-3">Ensinou</span>
                  <span className="block truncate text-texto">{troca.proposta_por.id === usuarioId ? troca.habilidade_ensino?.nome ?? "—" : troca.habilidade_aprendo?.nome ?? "—"}</span>
                </div>
                <span className="text-texto-3" aria-hidden="true">⇄</span>
                <div className="min-w-0 text-right">
                  <span className="block font-mono text-[11px] uppercase tracking-[0.08em] text-texto-3">Aprendeu</span>
                  <span className="block truncate text-texto">{troca.proposta_por.id === usuarioId ? troca.habilidade_aprendo?.nome ?? "—" : troca.habilidade_ensino?.nome ?? "—"}</span>
                </div>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 px-4">
              <Estrelas valor={estrelas} aoMudar={setEstrelas} />
              <p className="text-sm text-texto-2" aria-live="polite">{LEGENDAS[estrelas]}</p>
            </div>
            <div className="mt-3 px-4">
              <AreaTexto rotulo="Quer deixar um recado?" maxLength={500} rows={3} placeholder="O que foi legal, o que pode melhorar…" value={feedback} onChange={(evento) => setFeedback(evento.target.value)} />
            </div>
            {erro && <p className="mt-2 px-4 text-sm text-perigo" role="alert">{erro}</p>}
            <div className="sticky bottom-0 mt-3 flex items-center justify-between gap-2 border-t border-linha bg-superficie px-4 py-3">
              <Botao type="button" variante="fantasma" onClick={adiar}>Agora não</Botao>
              <Botao type="button" carregando={carregando} disabled={estrelas === 0 || carregando} onClick={enviar}>Enviar avaliação</Botao>
            </div>
          </>
        )}
      </Cartao>
    </div>
  );
}
