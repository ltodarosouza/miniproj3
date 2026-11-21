"use client";

import { useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { formatarDataHora, jaPassou } from "@/lib/datas";
import { confirmarTroca, recusarTroca, type Troca } from "@/lib/api";
import { meuId } from "@/lib/sessao";

export function CartaoTroca({ troca, aoAtualizar }: { troca: Troca; aoAtualizar: (troca: Troca) => void }) {
  const [carregando, setCarregando] = useState<"confirmar" | "recusar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const usuarioId = meuId();
  const propus = usuarioId === troca.proposta_por.id;
  const outraPessoa = propus ? troca.com : troca.proposta_por;
  const nomeOutraPessoa = outraPessoa.name.split(" ")[0];
  const habilidadeEnsino = troca.habilidade_ensino;
  const habilidadeAprendo = troca.habilidade_aprendo;
  const ambasHabilidades = Boolean(habilidadeEnsino && habilidadeAprendo);
  const passou = jaPassou(troca.data_hora);

  const titulo = troca.status === "confirmada"
    ? "Troca confirmada"
    : troca.status === "recusada"
      ? "Troca recusada"
      : propus
        ? "Você propôs uma troca"
        : `${nomeOutraPessoa} propôs uma troca`;

  const executarAcao = async (acao: "confirmar" | "recusar") => {
    setCarregando(acao);
    setErro(null);
    try {
      const atualizada = acao === "confirmar" ? await confirmarTroca(troca.id) : await recusarTroca(troca.id);
      aoAtualizar(atualizada);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível atualizar a troca. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  };

  return (
    <Cartao className={`mx-auto w-full max-w-sm p-4 space-y-3 transition-[color,opacity] duration-[var(--medio)] ease-saida motion-reduce:transition-none ${troca.status === "recusada" ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-controle ${troca.status === "confirmada" ? "text-sucesso" : "bg-marca-suave text-marca-forte"}`}>
          <Icone nome={troca.status === "confirmada" ? "confirmar" : "calendario"} tamanho={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-texto">{titulo}</h3>
          <p className="numeros text-sm text-texto-2">{formatarDataHora(troca.data_hora)}</p>
        </div>
      </div>

      {(habilidadeEnsino || habilidadeAprendo) && (
        <div className="space-y-2 text-sm text-texto-2">
          {habilidadeEnsino && (
            <p className="flex flex-wrap items-center gap-2">
              <span>{propus ? "Você ensina" : `${nomeOutraPessoa} te ensina`}</span>
              <TagHabilidade nome={habilidadeEnsino.nome} tipo="sei" destaque={ambasHabilidades} />
            </p>
          )}
          {habilidadeAprendo && (
            <p className="flex flex-wrap items-center gap-2">
              <span>{propus ? `${nomeOutraPessoa} te ensina` : "Você ensina"}</span>
              <TagHabilidade nome={habilidadeAprendo.nome} tipo="quero_aprender" destaque={ambasHabilidades} />
            </p>
          )}
        </div>
      )}

      {troca.status === "proposta" && (
        propus ? (
          <p className="flex items-center gap-2 text-sm text-texto-2">
            <span className="size-2 rounded-full bg-marca animate-pulse motion-reduce:animate-none" />
            Esperando {nomeOutraPessoa} confirmar
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Botao className="min-h-10 flex-1" onClick={() => executarAcao("confirmar")} carregando={carregando === "confirmar"} disabled={carregando !== null}>
              <Icone nome="confirmar" tamanho={18} />
              Confirmar
            </Botao>
            <Botao className="min-h-10 flex-1" variante="fantasma" onClick={() => executarAcao("recusar")} carregando={carregando === "recusar"} disabled={carregando !== null}>
              Recusar
            </Botao>
          </div>
        )
      )}

      {erro && <p className="text-sm text-perigo">{erro}</p>}

      {troca.status === "confirmada" && (
        passou ? (
          <p className="text-sm text-texto-2">A troca já aconteceu</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <a href={troca.link_google_agenda} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-controle border border-linha bg-superficie px-4 text-sm font-medium text-texto transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--rapido)] ease-saida hover:border-marca hover:text-marca-forte active:scale-[0.97]">
              <Icone nome="calendario" tamanho={16} />
              Adicionar ao Google Agenda
            </a>
            {troca.link_meet && (
              <a href={troca.link_meet} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-controle bg-marca px-4 text-sm font-medium text-marca-texto shadow-cartao transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--rapido)] ease-saida hover:bg-marca-forte active:scale-[0.97]">
                <Icone nome="link" tamanho={16} />
                Entrar na chamada
              </a>
            )}
          </div>
        )
      )}

      {troca.status === "recusada" && <p className="text-sm text-texto-2">Esta proposta foi recusada.</p>}
    </Cartao>
  );
}
