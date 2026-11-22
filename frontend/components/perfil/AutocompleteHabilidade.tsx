"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ErroApi, type HabilidadeResumo } from "@/lib/api";

type AutocompleteHabilidadeProps = {
  rotulo: string;
  dica?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (habilidade: HabilidadeResumo) => void;
  onMapear?: (habilidade: HabilidadeResumo | null) => void;
  buscarSugestoes: (prefixo: string) => Promise<{ items: HabilidadeResumo[] }>;
  mapearTexto: (texto: string) => Promise<{ habilidade: HabilidadeResumo | null }>;
  habilidadesExistentes: number[];
  limite?: number;
  disabled?: boolean;
};

export function AutocompleteHabilidade({
  rotulo,
  dica,
  placeholder = "Digite uma habilidade...",
  value,
  onChange,
  onSelect,
  onMapear,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setSugestaoMapeada(null);
    if (prefixo.length < 2) {
      setSugestoes([]);
      setAberto(false);
      return;
    }

    setCarregando(true);
    setErro(null);
    try {
      const { items } = await buscarSugestoes(prefixo);
      const filtradas = items.filter((h) => !habilidadesExistentes.includes(h.id));
      setSugestoes(filtradas.slice(0, limite));
      setIndiceAtivo(-1);
      setAberto(filtradas.length > 0);

      if (filtradas.length === 0) {
        const { habilidade } = await mapearTexto(prefixo);
        if (habilidade && !habilidadesExistentes.includes(habilidade.id)) {
          setSugestaoMapeada(habilidade);
          onMapear?.(habilidade);
        } else {
          onMapear?.(null);
        }
      }
    } catch (err) {
      setErro(err instanceof ErroApi ? err.message : "Erro ao buscar sugestões");
      setSugestoes([]);
      setAberto(false);
    } finally {
      setCarregando(false);
    }
  }

  function handleChange(evento: React.ChangeEvent<HTMLInputElement>) {
    const novo = evento.target.value;
    onChange(novo);
    setSugestaoMapeada(null);
    if (timerRef.current) clearTimeout(timerRef.current);
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
    onSelect(habilidade);
    onChange("");
    setSugestoes([]);
    setSugestaoMapeada(null);
    setAberto(false);
    setIndiceAtivo(-1);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-texto">
        {rotulo}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && sugestoes.length > 0 && setAberto(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={`${id}-sugestoes`}
        aria-activedescendant={
          indiceAtivo >= 0 ? `${id}-opcao-${indiceAtivo}` : undefined
        }
        className="w-full rounded-controle border border-linha-forte bg-superficie px-3 py-2 text-[0.9375rem] text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:outline-none focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] disabled:opacity-50"
      />
      {dica && !erro && <p className="mt-1.5 text-sm text-texto-3">{dica}</p>}
      {erro && (
        <p role="alert" className="mt-1.5 text-sm text-perigo">
          {erro}
        </p>
      )}
      {carregando && (
        <p className="mt-1.5 text-sm text-texto-3">Buscando...</p>
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
              className={`cursor-pointer px-3 py-2 text-sm ${
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

      {sugestaoMapeada && !aberto && (
        <p className="mt-2 text-sm text-texto-2">
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

      {!carregando &&
        !aberto &&
        !sugestaoMapeada &&
        value.length >= 2 &&
        sugestoes.length === 0 && (
          <p className="mt-2 text-sm text-texto-3">
            Escolha uma habilidade da lista.
          </p>
        )}
    </div>
  );
}
