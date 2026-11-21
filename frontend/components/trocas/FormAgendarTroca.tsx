"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Botao } from "@/components/ui/Botao";
import { Campo, Selecao } from "@/components/ui/Campo";
import { listarHabilidades, proporTroca, type HabilidadeResumo, type Troca } from "@/lib/api";
import { localParaIsoUtc } from "@/lib/datas";

type ErrosCampos = Partial<Record<"data" | "hora" | "ensino" | "aprendo" | "link", string>>;

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
  const habilidadesCarregadas = useRef(false);
  const nome = useMemo(() => comNome.trim().split(/\s+/)[0] || comUsername, [comNome, comUsername]);
  const [habilidades, setHabilidades] = useState<HabilidadeResumo[]>([]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [ensino, setEnsino] = useState("");
  const [aprendo, setAprendo] = useState("");
  const [link, setLink] = useState("");
  const [erros, setErros] = useState<ErrosCampos>({});
  const [erroApi, setErroApi] = useState("");
  const [carregandoHabilidades, setCarregandoHabilidades] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [minData, setMinData] = useState("");

  useEffect(() => {
    if (!aberto) {
      if (dialogo.current?.open) dialogo.current.close();
      return;
    }
    setMinData(new Date().toLocaleDateString("en-CA"));
    if (dialogo.current && !dialogo.current.open) dialogo.current.showModal();
    if (!habilidadesCarregadas.current) {
      habilidadesCarregadas.current = true;
      setCarregandoHabilidades(true);
      listarHabilidades()
        .then((resposta) => setHabilidades(resposta.items))
        .catch(() => setErroApi("Não deu para carregar as habilidades. Feche e tente de novo."))
        .finally(() => setCarregandoHabilidades(false));
    }
  }, [aberto]);

  function limpar() {
    setData("");
    setHora("");
    setEnsino("");
    setAprendo("");
    setLink("");
    setErros({});
    setErroApi("");
  }

  function validar(): ErrosCampos {
    const novosErros: ErrosCampos = {};
    if (!data) novosErros.data = "Escolha uma data.";
    if (!hora) novosErros.hora = "Escolha um horário.";
    if (!ensino && !aprendo) novosErros.ensino = "Escolha o que você ensina, o que aprende, ou os dois.";
    if (ensino && aprendo && ensino === aprendo) novosErros.aprendo = "Escolha habilidades diferentes.";
    if (data && hora && new Date(`${data}T${hora}`).getTime() <= Date.now()) {
      novosErros.data = "Escolha um horário que ainda não passou.";
      novosErros.hora = "Escolha um horário que ainda não passou.";
    }
    if (link && !link.startsWith("https://")) novosErros.link = "O link precisa começar com https://.";
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
      const troca = await proporTroca({
        com_username: comUsername,
        data_hora: localParaIsoUtc(data, hora),
        link_meet: link,
        habilidade_ensino_id: ensino ? Number(ensino) : null,
        habilidade_aprendo_id: aprendo ? Number(aprendo) : null,
      });
      limpar();
      aoCriar(troca);
    } catch (erro) {
      setErroApi(erro instanceof Error ? erro.message : "Não deu para propor a troca. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  const primeiroNome = nome.charAt(0).toLocaleUpperCase("pt-BR") + nome.slice(1);
  const porCategoria = (categoria: HabilidadeResumo["categoria"]) =>
    habilidades.filter((habilidade) => habilidade.categoria === categoria);

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
      className="m-auto w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-cartao border border-linha bg-superficie p-6 text-texto shadow-alta backdrop:bg-[color-mix(in_oklch,var(--texto)_35%,transparent)] backdrop:backdrop-blur-sm open:animate-[entrar-dialogo_var(--medio)_var(--ease-saida)_both] motion-reduce:open:animate-none max-sm:mt-auto max-sm:mb-0 max-sm:w-full max-sm:rounded-t-cartao max-sm:rounded-b-none max-sm:p-5"
    >
      <form onSubmit={enviar} className="flex max-h-[calc(100dvh-2.5rem)] flex-col gap-5 max-sm:max-h-[calc(100dvh-1.25rem)]">
        <header className="space-y-1">
          <h2 id="titulo-agendar-troca" className="text-lg font-semibold tracking-tight">
            Agendar troca com {primeiroNome}
          </h2>
          <p className="text-sm leading-relaxed text-texto-2">
            Escolham juntos o horário no chat. {primeiroNome} recebe a proposta e confirma.
          </p>
        </header>

        <div className="grid gap-4 overflow-y-auto sm:grid-cols-2">
          <Campo rotulo="Data" type="date" min={minData} required value={data} erro={erros.data} onChange={(evento) => setData(evento.target.value)} />
          <Campo rotulo="Hora" type="time" required value={hora} erro={erros.hora} onChange={(evento) => setHora(evento.target.value)} />
          <Selecao rotulo="Você ensina" value={ensino} erro={erros.ensino} onChange={(evento) => setEnsino(evento.target.value)}>
            <option value="">Nada desta vez</option>
            {carregandoHabilidades ? <option disabled>Carregando habilidades…</option> : null}
            <optgroup label="Tecnologia">
              {porCategoria("tech").map((habilidade) => <option key={habilidade.id} value={habilidade.id}>{habilidade.nome}</option>)}
            </optgroup>
            <optgroup label="Disciplinas">
              {porCategoria("disciplina").map((habilidade) => <option key={habilidade.id} value={habilidade.id}>{habilidade.nome}</option>)}
            </optgroup>
          </Selecao>
          <Selecao rotulo="Você aprende" value={aprendo} erro={erros.aprendo} onChange={(evento) => setAprendo(evento.target.value)}>
            <option value="">Nada desta vez</option>
            {carregandoHabilidades ? <option disabled>Carregando habilidades…</option> : null}
            <optgroup label="Tecnologia">
              {porCategoria("tech").map((habilidade) => <option key={habilidade.id} value={habilidade.id}>{habilidade.nome}</option>)}
            </optgroup>
            <optgroup label="Disciplinas">
              {porCategoria("disciplina").map((habilidade) => <option key={habilidade.id} value={habilidade.id}>{habilidade.nome}</option>)}
            </optgroup>
          </Selecao>
          <Campo
            rotulo="Link da chamada"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            dica="Pode deixar para depois e mandar no chat."
            erro={erros.link}
            value={link}
            onChange={(evento) => setLink(evento.target.value)}
            className="sm:col-span-2"
          />
        </div>

        {erroApi ? <p role="alert" className="text-sm text-perigo">{erroApi}</p> : null}

        <footer className="flex justify-end gap-2 max-sm:flex-col-reverse">
          <Botao type="button" variante="fantasma" className="max-sm:w-full" onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="troca" magnetico carregando={carregando} className="max-sm:w-full">Propor troca</Botao>
        </footer>
      </form>
      <style>{`@keyframes entrar-dialogo { from { opacity: 0; transform: translateY(0.5rem) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </dialog>
  );
}
