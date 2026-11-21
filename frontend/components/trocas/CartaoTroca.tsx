"use client";

import { useState } from "react";

import { Botao } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Icone } from "@/components/ui/Icone";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import { formatarDataHora, formatarQuando, jaPassou } from "@/lib/datas";
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
  const tipoEnsino = propus ? "sei" : "quero_aprender";
  const tipoAprendo = propus ? "quero_aprender" : "sei";

  const titulo = troca.status === "confirmada"
    ? "Troca confirmada"
    : troca.status === "recusada"
      ? "Troca recusada"
      : propus
        ? "Você propôs uma troca"
        : `${nomeOutraPessoa} propôs uma troca`;

  const momento = troca.respondida_em ?? troca.criada_em;
  const quando = formatarQuando(momento);
  const quandoTexto = quando.includes(":") ? `às ${quando}` : quando === "ontem" ? "ontem" : `em ${quando}`;
  const acao = troca.status === "confirmada" ? "Confirmada" : troca.status === "recusada" ? "Recusada" : "Proposta";

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
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-controle ${troca.status === "confirmada" ? "bg-[color-mix(in_oklch,var(--sucesso)_16%,transparent)] text-sucesso" : "bg-marca-suave text-marca-forte"}`}>
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
              <TagHabilidade nome={habilidadeEnsino.nome} tipo={tipoEnsino} destaque={ambasHabilidades} />
            </p>
          )}
          {habilidadeAprendo && (
            <p className="flex flex-wrap items-center gap-2">
              <span>{propus ? `${nomeOutraPessoa} te ensina` : "Você ensina"}</span>
              <TagHabilidade nome={habilidadeAprendo.nome} tipo={tipoAprendo} destaque={ambasHabilidades} />
            </p>
          )}
        </div>
      )}

      {troca.link_meet && (
        <a href={troca.link_meet} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 text-sm text-marca-forte hover:underline">
          <Icone nome="link" tamanho={16} />
          <span className="truncate">{new URL(troca.link_meet).host}</span>
        </a>
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
          <div className="flex flex-col gap-2">
            {troca.link_meet && (
              <a href={troca.link_meet} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-full select-none items-center justify-center gap-1.5 rounded-controle bg-marca px-3 text-sm font-medium text-marca-texto shadow-cartao transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--rapido)] ease-saida active:scale-[0.97] hover:bg-marca-forte motion-reduce:transition-none">
                <Icone nome="link" tamanho={16} />
                Entrar na chamada
              </a>
            )}
            <a href={troca.link_google_agenda} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-full select-none items-center justify-center gap-1.5 rounded-controle border border-linha-forte bg-superficie px-3 text-sm font-medium text-texto transition-[background-color,border-color,color,box-shadow,scale] duration-[var(--rapido)] ease-saida active:scale-[0.97] hover:border-marca hover:text-marca-forte motion-reduce:transition-none">
              <Icone nome="calendario" tamanho={16} />
              Adicionar ao Google Agenda
            </a>
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
