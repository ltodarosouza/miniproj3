"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { AreaTexto, Campo, Selecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { ErroApi } from "@/lib/api";
import {
  editarPost,
  habilidadesAgrupadas,
  LIMITE_MINUTOS,
  LIMITE_TEXTO_POST,
  type HabilidadesAgrupadas,
  type Post,
} from "@/lib/posts";

export function EditorPost({
  post,
  aoSalvar,
  aoCancelar,
}: {
  post: Post;
  aoSalvar: (post: Post) => void;
  aoCancelar: () => void;
}) {
  const [texto, setTexto] = useState(post.texto);
  const [habilidadeId, setHabilidadeId] = useState(post.habilidade ? String(post.habilidade.id) : "");
  const [minutos, setMinutos] = useState(post.minutos_estudados === null ? "" : String(post.minutos_estudados));
  const [grupos, setGrupos] = useState<HabilidadesAgrupadas | null>(null);
  const [erro, setErro] = useState("");
  const [semCatalogo, setSemCatalogo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const area = formulario.current?.querySelector("textarea");
    area?.focus();
    area?.setSelectionRange(area.value.length, area.value.length);
    let ativo = true;
    habilidadesAgrupadas()
      .then((resultado) => ativo && setGrupos(resultado))
      .catch(() => ativo && setSemCatalogo(true));
    return () => {
      ativo = false;
    };
  }, []);

  const numeroMinutos = minutos ? Number(minutos) : null;
  const minutosInvalidos =
    numeroMinutos !== null && (!Number.isInteger(numeroMinutos) || numeroMinutos < 1 || numeroMinutos > LIMITE_MINUTOS);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const textoLimpo = texto.trim();
    if (!textoLimpo || minutosInvalidos || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      aoSalvar(
        await editarPost(post.id, {
          texto: textoLimpo,
          habilidade_id: habilidadeId ? Number(habilidadeId) : null,
          minutos_estudados: numeroMinutos,
        }),
      );
    } catch (falha) {
      setErro(falha instanceof ErroApi ? falha.message : "Não deu para salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form
      ref={formulario}
      onSubmit={salvar}
      onKeyDown={(evento) => {
        if (evento.key === "Escape") {
          evento.stopPropagation();
          aoCancelar();
        }
      }}
      className="mt-4 space-y-4"
    >
      <AreaTexto
        rotulo="Editar publicação"
        required
        maxLength={LIMITE_TEXTO_POST}
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
      />
      {texto.length >= LIMITE_TEXTO_POST - 100 && (
        <p className="text-right text-xs text-texto-3">
          <span className="numeros">{texto.length}/{LIMITE_TEXTO_POST}</span>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          rotulo="Habilidade"
          erro={semCatalogo ? "Não deu para carregar as habilidades. Dá para manter ou tirar a atual." : undefined}
          value={habilidadeId} onChange={(evento) => setHabilidadeId(evento.target.value)}>
          <option value="">Sem habilidade</option>
          {post.habilidade && !grupos && <option value={post.habilidade.id}>{post.habilidade.nome}</option>}
          {grupos && (
            <>
              <optgroup label="Tecnologia">
                {grupos.tecnologia.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
              </optgroup>
              <optgroup label="Disciplinas">
                {grupos.disciplinas.map((h) => <option key={h.id} value={h.id}>{h.nome}</option>)}
              </optgroup>
            </>
          )}
        </Selecao>
        <Campo
          type="number"
          rotulo="Tempo estudado (min)"
          min={1}
          max={LIMITE_MINUTOS}
          inputMode="numeric"
          value={minutos}
          onChange={(evento) => setMinutos(evento.target.value)}
          erro={minutosInvalidos ? "Informe um número inteiro entre 1 e 1440." : undefined}
        />
      </div>
      {erro && <p role="alert" className="text-sm text-perigo">{erro}</p>}
      <div className="flex justify-end gap-2">
        <Botao type="button" variante="fantasma" tamanho="sm" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </Botao>
        <Botao type="submit" tamanho="sm" carregando={salvando} disabled={!texto.trim() || minutosInvalidos}>
          Salvar
        </Botao>
      </div>
    </form>
  );
}
