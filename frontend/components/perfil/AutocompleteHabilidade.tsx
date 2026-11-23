"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Icone } from "@/components/ui/Icone";
import type { HabilidadeResumo } from "@/lib/api";

type AutocompleteHabilidadeProps = {
  rotulo: string;
  dica?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (habilidade: HabilidadeResumo) => void;
  buscarSugestoes: (prefixo: string) => Promise<{ items: HabilidadeResumo[] }>;
  mapearTexto: (texto: string) => Promise<{ habilidade: HabilidadeResumo | null }>;
  habilidadesExistentes: number[];
  limite?: number;
  disabled?: boolean;
};

export function AutocompleteHabilidade({
  rotulo,
  dica,
  placeholder = "Digite para buscar...",
  value,
  onChange,
  onSelect,
  buscarSugestoes,
  mapearTexto,
  habilidadesExistentes,
  limite = 8,
  disabled = false,
}: AutocompleteHabilidadeProps) {
  const id = useId();
  const [sugestoes, setSugestoes] = useState<HabilidadeResumo[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sugestaoMapeada, setSugestaoMapeada] = useState<HabilidadeResumo | null>(null);
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const [buscou, setBuscou] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buscaAtualRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listboxRef.current &&
        !listboxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function buscar(prefixo: string) {
    const numeroBusca = ++buscaAtualRef.current;
    setSugestaoMapeada(null);
    setBuscou(false);
    if (prefixo.length < 2) {
      setSugestoes([]);
      setAberto(false);
      setBuscou(true);
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      const { items } = await buscarSugestoes(prefixo);
      if (numeroBusca !== buscaAtualRef.current) return;
      const filtradas = items.filter((h) => !habilidadesExistentes.includes(h.id));
      setSugestoes(filtradas.slice(0, limite));
      setIndiceAtivo(-1);
      setAberto(filtradas.length > 0);

      if (filtradas.length === 0) {
        try {
          const { habilidade } = await mapearTexto(prefixo);
          if (numeroBusca !== buscaAtualRef.current) return;
          if (habilidade && !habilidadesExistentes.includes(habilidade.id)) {
            setSugestaoMapeada(habilidade);
          }
        } catch {
        }
      }
    } catch {
      if (numeroBusca !== buscaAtualRef.current) return;
      setErro("Não consegui buscar agora. Tente de novo.");
      setSugestoes([]);
      setAberto(false);
    } finally {
      if (numeroBusca !== buscaAtualRef.current) return;
      setCarregando(false);
      setBuscou(true);
    }
  }

  function handleChange(evento: React.ChangeEvent<HTMLInputElement>) {
    const novo = evento.target.value;
    buscaAtualRef.current += 1;
    onChange(novo);
    setSugestaoMapeada(null);
    setBuscou(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (novo.length === 0) {
      buscaAtualRef.current += 1;
      setSugestoes([]);
      setAberto(false);
      setCarregando(false);
      setErro(null);
      setBuscou(true);
    }
    timerRef.current = setTimeout(() => buscar(novo), 200);
  }

  function handleKeyDown(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto && !sugestaoMapeada) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setIndiceAtivo((atual) =>
        atual < sugestoes.length - 1 ? atual + 1 : atual,
      );
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceAtivo((atual) => (atual > 0 ? atual - 1 : -1));
    } else if (evento.key === "Enter") {
      evento.preventDefault();
      if (indiceAtivo >= 0 && sugestoes[indiceAtivo]) {
        selecionar(sugestoes[indiceAtivo]);
      } else if (sugestaoMapeada) {
        selecionar(sugestaoMapeada);
      }
    } else if (evento.key === "Escape") {
      setAberto(false);
      setSugestaoMapeada(null);
    }
  }

  function selecionar(habilidade: HabilidadeResumo) {
    buscaAtualRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setCarregando(false);
    setErro(null);
    onSelect(habilidade);
    onChange("");
    setSugestoes([]);
    setSugestaoMapeada(null);
    setAberto(false);
    setIndiceAtivo(-1);
    setBuscou(false);
    inputRef.current?.focus();
  }

  const mostrarForaDaLista =
    buscou &&
    !carregando &&
    !aberto &&
    !sugestaoMapeada &&
    value.length >= 2 &&
    sugestoes.length === 0;

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-texto">
        {rotulo}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-texto-3">
          <Icone nome="busca" tamanho={18} />
        </span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && sugestoes.length > 0 && setAberto(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={aberto && sugestoes.length > 0}
          aria-controls={aberto && sugestoes.length > 0 ? `${id}-sugestoes` : undefined}
          aria-activedescendant={
            indiceAtivo >= 0 ? `${id}-opcao-${indiceAtivo}` : undefined
          }
          className="w-full h-10 rounded-controle border border-linha-forte bg-superficie pl-10 pr-3 text-[0.9375rem] text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:outline-none focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] disabled:opacity-50 motion-reduce:transition-none"
        />
      </div>
      {dica && !erro && <p className="text-sm text-texto-3">{dica}</p>}
      {erro && (
        <p role="status" className="text-sm text-texto-2">
          {erro}
        </p>
      )}
      {carregando && (
        <p role="status" aria-live="polite" className="text-sm text-texto-3">Buscando…</p>
      )}

      {aberto && sugestoes.length > 0 && (
        <ul
          ref={listboxRef}
          id={`${id}-sugestoes`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-controle border border-linha-forte bg-superficie py-1 shadow-cartao"
        >
          {sugestoes.map((habilidade, indice) => (
            <li
              key={habilidade.id}
              id={`${id}-opcao-${indice}`}
              role="option"
              aria-selected={indice === indiceAtivo}
              onClick={() => selecionar(habilidade)}
              onMouseEnter={() => setIndiceAtivo(indice)}
              className={`min-h-10 cursor-pointer px-3 py-2 text-sm transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${
                indice === indiceAtivo
                  ? "bg-superficie-2 text-texto"
                  : "text-texto-2"
              }`}
            >
              {habilidade.nome}
            </li>
          ))}
        </ul>
      )}

      <div aria-live="polite" className="text-sm text-texto-2">
        {sugestaoMapeada && !aberto && (
          <p>
            Você quis dizer{" "}
            <button
              type="button"
              onClick={() => selecionar(sugestaoMapeada)}
              className="font-medium text-marca hover:underline"
            >
              {sugestaoMapeada.nome}
            </button>
            ?
          </p>
        )}
      </div>

      {mostrarForaDaLista && (
        <p className="text-sm text-texto-3">
          Escolha uma habilidade da lista.
        </p>
      )}
    </div>
  );
}
