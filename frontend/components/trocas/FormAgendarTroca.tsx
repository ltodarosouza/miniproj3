"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { AutocompleteHabilidade } from "@/components/perfil/AutocompleteHabilidade";
import { SeletorDeHorario } from "@/components/trocas/SeletorDeHorario";
import { Botao } from "@/components/ui/Botao";
import { TagHabilidade } from "@/components/ui/TagHabilidade";
import {
  buscarAutocomplete,
  mapearHabilidade,
  type HabilidadeComNivel,
  type HabilidadeResumo,
  type Troca,
} from "@/lib/api";
import { localParaIsoUtc } from "@/lib/datas";
import { dataDaOrdem, enviarPropostaDeTroca, obterOpcoesTroca, type OpcoesTroca } from "@/lib/trocas";

type Lado = "ensino" | "aprendo";
type Opcao = { id: number; nome: string; nivel?: number };
type ErrosCampos = Partial<Record<"horario" | "habilidades", string>>;

function RotuloDoBloco({ numero, texto, detalhe }: { numero: string; texto: string; detalhe?: string }) {
  return (
    <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 [overflow-wrap:anywhere]">
      <span className="font-mono text-xs text-texto-3">{numero} ·</span>
      <span className="text-sm font-medium text-texto">{texto}</span>
      {detalhe && <span className="min-w-0 text-xs text-texto-2">{detalhe}</span>}
    </span>
  );
}

function ChipsDeHabilidade({
  rotulo,
  opcoes,
  escolhida,
  aoEscolher,
  children,
}: {
  rotulo: ReactNode;
  opcoes: Opcao[];
  escolhida: number | null;
  aoEscolher: (id: number | null) => void;
  children?: ReactNode;
}) {
  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="mb-2">{rotulo}</legend>
      {opcoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {opcoes.map((opcao) => {
            const ativa = opcao.id === escolhida;
            return (
              <button
                key={opcao.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => aoEscolher(ativa ? null : opcao.id)}
                className="rounded-full transition-[scale] duration-[var(--rapido)] active:scale-[0.96] motion-reduce:transition-none"
              >
                <TagHabilidade nome={opcao.nome} tipo={ativa ? "sei" : "neutra"} nivel={opcao.nivel} destaque={ativa} />
              </button>
            );
          })}
        </div>
      )}
      {children}
    </fieldset>
  );
}

function comoOpcoes(itens: HabilidadeComNivel[]): Opcao[] {
  return itens.map(({ id, nome, nivel }) => ({ id, nome, nivel }));
}

export function FormAgendarTroca({
  comUsername,
  comNome,
  aberto,
  aoFechar,
  aoCriar,
}: {
  comUsername: string;
  comNome: string;
  aberto: boolean;
  aoFechar: () => void;
  aoCriar: (troca: Troca) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const nome = useMemo(() => comNome.trim().split(/\s+/)[0] || comUsername, [comNome, comUsername]);
  const [opcoes, setOpcoes] = useState<OpcoesTroca | null>(null);
  const [extras, setExtras] = useState<Record<Lado, Opcao[]>>({ ensino: [], aprendo: [] });
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [ensino, setEnsino] = useState<number | null>(null);
  const [aprendo, setAprendo] = useState<number | null>(null);
  const [outra, setOutra] = useState<Lado | null>(null);
  const [busca, setBusca] = useState("");
  const [erros, setErros] = useState<ErrosCampos>({});
  const [erroApi, setErroApi] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [abertura, setAbertura] = useState(0);
  const [erroOpcoes, setErroOpcoes] = useState(false);

  useEffect(() => {
    if (!aberto) {
      if (dialogo.current?.open) dialogo.current.close();
      return;
    }
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
    limpar();
    setOpcoes(null);
    setErroOpcoes(false);
    setAbertura((n) => n + 1);
    let ativo = true;
    obterOpcoesTroca(comUsername)
      .then((resposta) => {
        if (!ativo) return;
        setOpcoes(resposta);
        if (resposta.eu_ensino.length === 1) setEnsino(resposta.eu_ensino[0].id);
        if (resposta.eu_aprendo.length === 1) setAprendo(resposta.eu_aprendo[0].id);
      })
      .catch(() => {
        if (!ativo) return;
        setErroOpcoes(true);
        setOpcoes({ eu_ensino: [], eu_aprendo: [] });
      });
    return () => {
      ativo = false;
    };
  }, [aberto, comUsername]);

  function limpar() {
    setData("");
    setHora("");
    setEnsino(null);
    setAprendo(null);
    setExtras({ ensino: [], aprendo: [] });
    setOutra(null);
    setBusca("");
    setErros({});
    setErroApi("");
  }

  function validar(): ErrosCampos {
    const novosErros: ErrosCampos = {};
    if (!data || !hora) novosErros.horario = "Escolha o dia e o horário.";
    else if (new Date(`${data}T${hora}`).getTime() <= Date.now()) novosErros.horario = "Escolha um horário que ainda não passou.";
    if (ensino === null && aprendo === null) novosErros.habilidades = "Escolha o que você ensina, o que aprende, ou os dois.";
    else if (ensino !== null && ensino === aprendo) novosErros.habilidades = "Escolha habilidades diferentes.";
    return novosErros;
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros = validar();
    setErros(novosErros);
    setErroApi("");
    if (Object.keys(novosErros).length) return;

    setCarregando(true);
    try {
      const troca = await enviarPropostaDeTroca({
        com_username: comUsername,
        data_hora: localParaIsoUtc(data, hora),
        habilidade_ensino_id: ensino,
        habilidade_aprendo_id: aprendo,
      });
      limpar();
      aoCriar(troca);
      aoFechar();
    } catch (erro) {
      setErroApi(erro instanceof Error ? erro.message : "Não deu para propor a troca. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  function adicionarOutra(habilidade: HabilidadeResumo) {
    if (!outra) return;
    const lado = outra;
    setExtras((atual) => ({
      ...atual,
      [lado]: atual[lado].some((h) => h.id === habilidade.id) ? atual[lado] : [...atual[lado], { id: habilidade.id, nome: habilidade.nome }],
    }));
    (lado === "ensino" ? setEnsino : setAprendo)(habilidade.id);
    setOutra(null);
    setBusca("");
  }

  function alternarOutra(lado: Lado | null) {
    setBusca("");
    setOutra(lado);
  }

  const primeiroNome = nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1);
  const opcoesEnsino = [...comoOpcoes(opcoes?.eu_ensino ?? []), ...extras.ensino];
  const opcoesAprendo = [...comoOpcoes(opcoes?.eu_aprendo ?? []), ...extras.aprendo];
  const nadaEmComum = opcoes !== null && !erroOpcoes && opcoesEnsino.length === 0 && opcoesAprendo.length === 0;
  const nomeEnsino = opcoesEnsino.find((opcao) => opcao.id === ensino)?.nome ?? "—";
  const nomeAprendo = opcoesAprendo.find((opcao) => opcao.id === aprendo)?.nome ?? "—";

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-agendar-troca"
      onCancel={(evento) => {
        evento.preventDefault();
        aoFechar();
      }}
      onClick={(evento) => {
        if (evento.target === dialogo.current) aoFechar();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-cartao border border-linha bg-superficie p-6 text-texto shadow-alta backdrop:bg-[oklch(0.16_0.012_200/0.55)] backdrop:backdrop-blur-sm open:animate-[aparecer-escala_var(--medio)_var(--ease-saida)_both] motion-reduce:open:animate-none max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:rounded-t-cartao max-sm:rounded-b-none max-sm:p-5"
    >
      <form onSubmit={enviar} noValidate className="flex max-h-[calc(100dvh-5.5rem)] flex-col gap-5 max-sm:max-h-[calc(100dvh-5rem)]">
        <div className="min-h-24 space-y-5 overflow-x-hidden overflow-y-auto [scrollbar-gutter:stable]">
          <header className="space-y-1 [overflow-wrap:anywhere]">
            <h2 id="titulo-agendar-troca" className="text-lg font-semibold tracking-tight">
              Agendar troca com {primeiroNome}
            </h2>
            <p className="text-sm leading-relaxed text-texto-2">
              {primeiroNome} recebe a proposta e confirma. Depois, cada um salva no Google Agenda com o Meet.
            </p>
          </header>

          <div className="space-y-4">
            {opcoes === null && <p className="text-sm text-texto-3" role="status">Carregando habilidades em comum…</p>}
            {erroOpcoes && (
              <p role="alert" className="text-sm text-texto-2">Não deu para carregar as habilidades em comum. Escolha uma do catálogo.</p>
            )}
            {nadaEmComum && (
              <p className="text-sm text-texto-2">Vocês ainda não têm habilidades em comum no perfil. Escolha uma do catálogo.</p>
            )}
            <ChipsDeHabilidade
              rotulo={<RotuloDoBloco numero="01" texto="Você ensina" />}
              opcoes={opcoesEnsino}
              escolhida={ensino}
              aoEscolher={setEnsino}
            >
              {outra === "ensino" ? (
                <div className="space-y-2">
                  <AutocompleteHabilidade
                    rotulo="Outra habilidade que você ensina"
                    value={busca}
                    onChange={setBusca}
                    onSelect={adicionarOutra}
                    buscarSugestoes={buscarAutocomplete}
                    mapearTexto={mapearHabilidade}
                    habilidadesExistentes={opcoesEnsino.map((h) => h.id)}
                  />
                  <button type="button" onClick={() => alternarOutra(null)} className="text-sm text-texto-2 underline underline-offset-2">Cancelar</button>
                </div>
              ) : opcoes !== null ? (
                <button type="button" onClick={() => alternarOutra("ensino")} className="text-sm font-medium text-marca-forte underline underline-offset-2">Outra que eu ensino</button>
              ) : null}
            </ChipsDeHabilidade>
            <ChipsDeHabilidade
              rotulo={<RotuloDoBloco numero="02" texto="Você aprende" detalhe={`com ${primeiroNome}`} />}
              opcoes={opcoesAprendo}
              escolhida={aprendo}
              aoEscolher={setAprendo}
            >
              {outra === "aprendo" ? (
                <div className="space-y-2 [overflow-wrap:anywhere]">
                  <AutocompleteHabilidade
                    rotulo={`Outra habilidade que ${primeiroNome} te ensina`}
                    value={busca}
                    onChange={setBusca}
                    onSelect={adicionarOutra}
                    buscarSugestoes={buscarAutocomplete}
                    mapearTexto={mapearHabilidade}
                    habilidadesExistentes={opcoesAprendo.map((h) => h.id)}
                  />
                  <button type="button" onClick={() => alternarOutra(null)} className="text-sm text-texto-2 underline underline-offset-2">Cancelar</button>
                </div>
              ) : opcoes !== null ? (
                <button type="button" onClick={() => alternarOutra("aprendo")} className="text-sm font-medium text-marca-forte underline underline-offset-2">Outra que eu aprendo</button>
              ) : null}
            </ChipsDeHabilidade>
            {erros.habilidades && <p role="alert" className="text-sm text-perigo">{erros.habilidades}</p>}
          </div>
          <SeletorDeHorario key={abertura} rotulo={<RotuloDoBloco numero="03" texto="Quando" />} data={data} hora={hora} aoMudarData={setData} aoMudarHora={setHora} erro={erros.horario} />
        </div>

        <section aria-label="Resumo da ordem" className="min-w-0 rounded-controle border border-linha bg-superficie-2 px-3 py-2.5 text-sm [overflow-wrap:anywhere]">
          <p className="font-mono text-xs uppercase tracking-wide text-texto-3">Resumo da ordem</p>
          <p className="flex flex-wrap gap-x-1">
            <span>Você ensina <span aria-hidden="true">→</span></span>
            <span className="min-w-0">{nomeEnsino}</span>
          </p>
          <p className="flex flex-wrap gap-x-1">
            <span className="min-w-0">{primeiroNome} ensina <span aria-hidden="true">→</span></span>
            <span className="min-w-0">{nomeAprendo}</span>
          </p>
          <p className={`font-mono numeros ${data && hora ? "" : "text-texto-3"}`}>
            {data && hora ? dataDaOrdem(localParaIsoUtc(data, hora)) : "escolha o dia e o horário"}
          </p>
        </section>

        {erroApi ? <p role="alert" className="text-sm text-perigo">{erroApi.charAt(0).toLocaleUpperCase("pt-BR") + erroApi.slice(1)}</p> : null}

        <footer className="flex justify-end gap-2 max-sm:flex-col-reverse">
          <Botao type="button" variante="fantasma" className="max-sm:w-full" onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="troca" magnetico carregando={carregando} className="max-sm:w-full">Propor troca</Botao>
        </footer>
      </form>
    </dialog>
  );
}
