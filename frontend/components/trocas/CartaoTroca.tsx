"use client";

import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { celebrar } from "@/components/ui/Celebrar";
import { dataDaOrdem, numeroDaOrdem, ROTULO_STATUS, statusDaOrdem } from "@/lib/trocas";
import { formatarQuando, jaPassou } from "@/lib/datas";
import { confirmarTroca, recusarTroca, type Troca } from "@/lib/api";
import { meuId } from "@/lib/sessao";
import { vibrar } from "@/lib/movimento";

export function CartaoTroca({ troca, aoAtualizar }: { troca: Troca; aoAtualizar: (troca: Troca) => void }) {
  const [carregando, setCarregando] = useState<"confirmar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => setAgora(Date.now()), 60000);
    return () => clearInterval(intervalo);
  }, []);
  const usuarioId = meuId();
  const propus = usuarioId === troca.proposta_por.id;
  const outraPessoa = propus ? troca.com : troca.proposta_por;
  const nomeOutraPessoa = outraPessoa.name.split(" ")[0];
  const habilidadeEnsino = troca.habilidade_ensino;
  const habilidadeAprendo = troca.habilidade_aprendo;
  const status = statusDaOrdem(troca, agora);
  const corStatus = {
    aberta: "bg-troca",
    confirmada: "bg-sucesso",
    concluida: "bg-texto-2",
    recusada: "bg-perigo",
  }[status];
  const passou = jaPassou(troca.data_hora);
  const momento = troca.respondida_em ?? troca.criada_em;
  const quando = formatarQuando(momento);
  const quandoTexto = quando.includes(":") ? `às ${quando}` : quando === "ontem" ? "ontem" : `em ${quando}`;
  const acao = troca.status === "confirmada" ? "Confirmada" : troca.status === "recusada" ? "Recusada" : "Proposta";

  const executarAcao = async (acao: "confirmar" | "recusar") => {
    setCarregando(acao);
    setErro(null);
    try {
      const atualizada = acao === "confirmar" ? await confirmarTroca(troca.id) : await recusarTroca(troca.id);
      if (acao === "confirmar") {
        celebrar();
        vibrar(10);
      }
      aoAtualizar(atualizada);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível atualizar a troca. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  };

  return (
    <Cartao className={`mx-auto w-full max-w-sm p-4 space-y-3 transition-[color,opacity] duration-[var(--medio)] ease-saida motion-reduce:transition-none ${troca.status === "recusada" ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-texto-2">{numeroDaOrdem(troca.id)}</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-texto-2">
          <span aria-hidden className={`size-2 rounded-full ${corStatus}`} />
          {ROTULO_STATUS[status]}
        </span>
      </div>

      <p className="text-sm text-texto">{propus ? `Você propôs a ${nomeOutraPessoa}` : `${nomeOutraPessoa} propôs a você`}</p>

      {(habilidadeEnsino || habilidadeAprendo) && (
        <div className="border-y border-linha py-2.5">
          <div className="space-y-2">
            {habilidadeEnsino && (
              <p className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-texto-2">{propus ? "Você ensina" : `${nomeOutraPessoa} ensina`}</span>
                <span aria-hidden className="shrink-0 text-texto-3">→</span>
                <span className="min-w-0 truncate font-medium text-texto">{habilidadeEnsino.nome}</span>
              </p>
            )}
            {habilidadeEnsino && habilidadeAprendo && (
              <div aria-hidden className="relative h-px bg-linha">
                <span className="absolute left-1/2 top-1/2 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-linha bg-superficie text-marca-forte">
                  <Icone nome="troca" tamanho={14} />
                </span>
              </div>
            )}
            {habilidadeAprendo && (
              <p className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-texto-2">{propus ? `${nomeOutraPessoa} ensina` : "Você ensina"}</span>
                <span aria-hidden className="shrink-0 text-texto-3">→</span>
                <span className="min-w-0 truncate font-medium text-texto">{habilidadeAprendo.nome}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <p className="font-mono numeros text-sm text-texto"><time dateTime={troca.data_hora}>{dataDaOrdem(troca.data_hora, agora)}</time></p>

      {troca.status === "proposta" && (
        propus ? (
          <p className="flex items-center gap-2 text-sm text-texto-2">
            <span className="size-2 rounded-full bg-troca animate-pulse motion-reduce:animate-none" />
            Aguardando @{outraPessoa.username} confirmar
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <Botao className="min-h-10 flex-1" onClick={() => executarAcao("confirmar")} carregando={carregando === "confirmar"} disabled={carregando !== null}>
              <Icone nome="confirmar" tamanho={18} />
              Confirmar
            </Botao>
            <Botao className="min-h-10" variante="fantasma" onClick={() => executarAcao("recusar")} carregando={carregando === "recusar"} disabled={carregando !== null}>
              Recusar
            </Botao>
          </div>
        )
      )}

      {erro && <p role="alert" className="text-sm text-perigo">{erro.charAt(0).toLocaleUpperCase("pt-BR") + erro.slice(1)}</p>}

      {troca.status === "confirmada" && (
        passou ? (
          <p className="text-sm text-texto-2">A troca já aconteceu</p>
        ) : (
          <div className="flex flex-col gap-2">
            <a href={troca.link_google_agenda} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-full select-none items-center justify-center gap-1.5 rounded-controle bg-marca px-3 text-sm font-medium text-marca-texto shadow-cartao transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--rapido)] ease-saida active:scale-[0.97] hover:bg-marca-forte motion-reduce:transition-none">
              <Icone nome="calendario" tamanho={16} />
              Agendar no Google Agenda
            </a>
            <p className="text-xs leading-relaxed text-texto-2">
              No Google Agenda, clique em <strong className="font-medium text-texto">Adicionar videoconferência do Google Meet</strong> e salve.
            </p>
          </div>
        )
      )}

      {troca.status === "recusada" && <p className="text-sm text-texto-2">{propus ? `${nomeOutraPessoa} não pôde desta vez. Que tal combinar outro horário?` : "Você recusou esta proposta."}</p>}
      <p className="numeros border-t border-linha pt-2.5 text-xs text-texto-3">
        <time dateTime={momento}>{acao} {quandoTexto}</time>
      </p>
    </Cartao>
  );
}
