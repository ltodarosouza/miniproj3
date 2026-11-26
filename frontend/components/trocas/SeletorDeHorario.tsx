"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Icone } from "@/components/ui/Icone";
import { dataLocal, resumoDoHorario } from "@/lib/datas";

const MES = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const POR_EXTENSO = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const HORARIOS = Array.from({ length: 29 }, (_, i) => {
  const minutos = 8 * 60 + i * 30;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
});

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

function deTexto(texto: string): Date {
  const [ano, mes, dia] = texto.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function semHorarioLivre(dia: Date): boolean {
  return horarioPassou(dataLocal(dia), HORARIOS[HORARIOS.length - 1]);
}

function proximoSabado(hoje: Date): Date {
  const falta = (6 - hoje.getDay() + 7) % 7;
  return somarDias(hoje, falta === 0 ? 7 : falta);
}

function horarioPassou(data: string, hora: string): boolean {
  return new Date(`${data}T${hora}`).getTime() <= Date.now();
}

export function SeletorDeHorario({
  data,
  hora,
  aoMudarData,
  aoMudarHora,
  erro,
  rotulo = "Quando",
}: {
  data: string;
  hora: string;
  aoMudarData: (data: string) => void;
  aoMudarHora: (hora: string) => void;
  erro?: string;
  rotulo?: ReactNode;
}) {
  const hoje = useMemo(() => inicioDoDia(new Date()), []);
  const inicial = useMemo(() => (semHorarioLivre(hoje) ? somarDias(hoje, 1) : hoje), [hoje]);
  const [mes, setMes] = useState(() => new Date(inicial.getFullYear(), inicial.getMonth(), 1));
  const [foco, setFoco] = useState<string>(data || dataLocal(inicial));
  const grade = useRef<HTMLDivElement>(null);
  const navegandoPorTeclado = useRef(false);

  useEffect(() => {
    if (!navegandoPorTeclado.current) return;
    navegandoPorTeclado.current = false;
    grade.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [foco, mes]);

  const dias = useMemo(() => {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const total = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: primeiro.getDay() }, () => null),
      ...Array.from({ length: total }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
    ];
  }, [mes]);

  const semanas = Array.from({ length: Math.ceil(dias.length / 7) }, (_, i) => dias.slice(i * 7, i * 7 + 7));
  const noPrimeiroMes = mes.getFullYear() === inicial.getFullYear() && mes.getMonth() === inicial.getMonth();

  function escolher(dia: Date) {
    if (semHorarioLivre(dia)) return;
    const texto = dataLocal(dia);
    setFoco(texto);
    setMes(new Date(dia.getFullYear(), dia.getMonth(), 1));
    aoMudarData(texto);
    if (hora && horarioPassou(texto, hora)) aoMudarHora("");
  }

  function mudarMes(delta: number) {
    const novo = new Date(mes.getFullYear(), mes.getMonth() + delta, 1);
    if (novo < new Date(inicial.getFullYear(), inicial.getMonth(), 1)) return;
    setMes(novo);
    setFoco(dataLocal(novo <= inicial ? inicial : novo));
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const passos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const atual = deTexto(foco);
    if (evento.key in passos) {
      evento.preventDefault();
      const proximo = somarDias(atual, passos[evento.key]);
      if (semHorarioLivre(proximo)) return;
      navegandoPorTeclado.current = true;
      setFoco(dataLocal(proximo));
      if (proximo.getMonth() !== mes.getMonth() || proximo.getFullYear() !== mes.getFullYear()) {
        setMes(new Date(proximo.getFullYear(), proximo.getMonth(), 1));
      }
    } else if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      escolher(atual);
    }
  }

  const atalhos = [
    ...(semHorarioLivre(hoje) ? [] : [{ rotulo: "Hoje", dia: hoje }]),
    { rotulo: "Amanhã", dia: somarDias(hoje, 1) },
    ...(proximoSabado(hoje).getTime() === somarDias(hoje, 1).getTime() ? [] : [{ rotulo: "Sábado", dia: proximoSabado(hoje) }]),
  ];
  const nomeDoMes = MES.format(mes);
  const tituloMes = nomeDoMes.charAt(0).toLocaleUpperCase("pt-BR") + nomeDoMes.slice(1);

  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-2 text-sm font-medium text-texto">{rotulo}</legend>

      <div className="flex flex-wrap gap-2">
        {atalhos.map(({ rotulo, dia }) => {
          const ativo = data === dataLocal(dia);
          return (
            <button
              key={rotulo}
              type="button"
              onClick={() => escolher(dia)}
              aria-pressed={ativo}
              className={`h-8 rounded-controle border px-3 text-sm font-medium transition-colors duration-[var(--rapido)] motion-reduce:transition-none ${ativo ? "border-marca bg-marca text-marca-texto" : "border-linha-forte text-texto hover:border-marca hover:text-marca-forte"}`}
            >
              {rotulo}
            </button>
          );
        })}
      </div>

      <div className="rounded-controle border border-linha p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            disabled={noPrimeiroMes}
            aria-label="Mês anterior"
            className="flex size-9 items-center justify-center rounded-controle text-texto-2 hover:bg-superficie-2 disabled:opacity-30"
          >
            <Icone nome="voltar" tamanho={18} />
          </button>
          <p className="text-sm font-medium text-texto" aria-live="polite">{tituloMes}</p>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="flex size-9 items-center justify-center rounded-controle text-texto-2 hover:bg-superficie-2"
          >
            <span className="rotate-180">
              <Icone nome="voltar" tamanho={18} />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-texto-3" aria-hidden>
          {SEMANA.map((letra, i) => <span key={i} className="py-1">{letra}</span>)}
        </div>
        <div ref={grade} role="grid" aria-label={tituloMes} onKeyDown={aoTeclar} className="space-y-1">
          {semanas.map((semana, s) => (
            <div key={s} role="row" className="grid grid-cols-7 gap-1">
              {semana.map((dia, i) => {
                if (!dia) return <span key={`vazio-${i}`} role="gridcell" />;
                const texto = dataLocal(dia);
                const passou = semHorarioLivre(dia);
                const escolhido = texto === data;
                const ehHoje = texto === dataLocal(hoje);
                return (
                  <button
                    key={texto}
                    type="button"
                    role="gridcell"
                    data-dia={texto}
                    tabIndex={texto === foco ? 0 : -1}
                    disabled={passou}
                    aria-selected={escolhido}
                    aria-label={POR_EXTENSO.format(dia)}
                    onClick={() => escolher(dia)}
                    className={`font-mono numeros mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-colors duration-[var(--rapido)] motion-reduce:transition-none disabled:text-texto-3 disabled:opacity-40 ${escolhido ? "bg-marca font-semibold text-marca-texto" : ehHoje ? "font-semibold text-marca-forte ring-1 ring-marca" : "text-texto hover:bg-superficie-2"}`}
                  >
                    {dia.getDate()}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-texto-2">Horário</p>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
          {HORARIOS.map((horario) => {
            const indisponivel = !data || horarioPassou(data, horario);
            const ativo = horario === hora;
            return (
              <button
                key={horario}
                type="button"
                disabled={indisponivel}
                aria-pressed={ativo}
                onClick={() => aoMudarHora(horario)}
                className={`font-mono numeros h-9 w-full rounded-controle border text-sm transition-colors duration-[var(--rapido)] motion-reduce:transition-none disabled:opacity-35 ${ativo ? "border-marca bg-marca font-medium text-marca-texto" : "border-linha-forte text-texto hover:border-marca"}`}
              >
                {horario}
              </button>
            );
          })}
        </div>
        {!data && <p className="text-xs text-texto-3">Escolha o dia para liberar os horários.</p>}
      </div>

      {data && hora && (
        <p className="font-mono numeros rounded-controle bg-marca-suave px-3 py-2 text-sm font-medium text-marca-forte" aria-live="polite">
          {resumoDoHorario(data, hora)}
        </p>
      )}
      {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
    </fieldset>
  );
}
