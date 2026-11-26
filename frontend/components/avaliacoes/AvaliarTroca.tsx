"use client";

import { useEffect, useRef, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { AreaTexto } from "@/components/ui/Campo";
import { Estrelas } from "@/components/ui/Estrelas";
import { Icone } from "@/components/ui/Icone";
import { avaliarTroca, type Troca } from "@/lib/api";
import { avisarAvaliacaoEnviada } from "@/lib/avaliacoes";
import { meuId } from "@/lib/sessao";

const LEGENDAS = ["", "Não rolou", "Poderia ser melhor", "Foi ok", "Foi muito bom", "Aprendi demais!"];

export function AvaliarTroca({ troca, aoAvaliar }: { troca: Troca; aoAvaliar: (trocaId: number) => void }) {
  const [estrelas, setEstrelas] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const usuarioId = meuId();
  const outraPessoa = troca.proposta_por.id === usuarioId ? troca.com : troca.proposta_por;
  const primeiroNome = outraPessoa.name.split(" ")[0];

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  async function enviar() {
    if (estrelas === 0 || carregando) return;
    setCarregando(true);
    setErro("");
    try {
      await avaliarTroca(troca.id, estrelas, feedback);
      avisarAvaliacaoEnviada();
      setSucesso(true);
      timeoutRef.current = window.setTimeout(() => aoAvaliar(troca.id), 2500);
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : "Não foi possível enviar sua avaliação.";
      if (mensagem.toLowerCase().includes("já avaliou")) {
        avisarAvaliacaoEnviada();
        aoAvaliar(troca.id);
      } else {
        setErro(mensagem);
      }
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="flex items-start gap-2" aria-live="polite">
        <Icone nome="confirmar" tamanho={20} className="shrink-0 text-sucesso" />
        <p className="text-sm leading-relaxed text-texto">Obrigado! Sua avaliação foi enviada.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby={`titulo-avaliacao-${troca.id}`}>
      <h3 id={`titulo-avaliacao-${troca.id}`} className="font-semibold tracking-[-0.01em] text-texto">Como foi a troca com {primeiroNome}?</h3>
      <p className="mt-1 font-mono text-xs text-texto-2">Avalie para ajudar outras pessoas a escolherem com quem aprender.</p>
      <div className="mt-3 flex items-center gap-3">
        <Estrelas valor={estrelas} aoMudar={setEstrelas} />
        <p className="text-sm text-texto-2" aria-live="polite">{LEGENDAS[estrelas]}</p>
      </div>
      <div className="mt-3">
        <AreaTexto rotulo="Quer deixar um recado?" maxLength={500} rows={3} placeholder="O que foi legal, o que pode melhorar…" value={feedback} onChange={(evento) => setFeedback(evento.target.value)} />
      </div>
      {erro && <p className="mt-2 text-sm text-perigo" role="alert">{erro}</p>}
      <div className="mt-3 flex justify-end">
        <Botao type="button" carregando={carregando} disabled={estrelas === 0 || carregando} onClick={enviar}>Enviar avaliação</Botao>
      </div>
    </section>
  );
}
