"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { AreaTexto, Campo, Selecao } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";
import { ErroApi } from "@/lib/api";
import { prepararImagem, removerImagemDoPost } from "@/lib/imagens";
import {
  editarPost,
  habilidadesAgrupadas,
  LIMITE_MINUTOS,
  LIMITE_TEXTO_POST,
  enviarImagem,
  urlDaImagem,
  validarImagem,
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
  const [foto, setFoto] = useState<File | null>(null);
  const [urlPrevia, setUrlPrevia] = useState("");
  const [removerFoto, setRemoverFoto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const entradaFoto = useRef<HTMLInputElement>(null);
  const urlAtual = useRef("");

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

  useEffect(() => () => {
    if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
  }, []);

  async function escolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0] ?? null;
    evento.target.value = "";
    setErro("");
    if (!arquivo) return;
    try {
      const preparada = await prepararImagem(arquivo);
      const mensagem = validarImagem(preparada);
      if (mensagem) throw new Error(mensagem);
      if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
      const url = URL.createObjectURL(preparada);
      urlAtual.current = url;
      setUrlPrevia(url);
      setFoto(preparada);
      setRemoverFoto(false);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível preparar a foto.");
    }
  }

  function limparFoto() {
    if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
    urlAtual.current = "";
    setUrlPrevia("");
    setFoto(null);
    setRemoverFoto(true);
    setErro("");
    if (entradaFoto.current) entradaFoto.current.value = "";
  }

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
      const salvo = await editarPost(post.id, {
          texto: textoLimpo,
          habilidade_id: habilidadeId ? Number(habilidadeId) : null,
          minutos_estudados: numeroMinutos,
        });
      let final = salvo;
      try {
        if (foto) {
          final = { ...salvo, imagem_url: await enviarImagem(post.id, foto) };
        } else if (removerFoto) {
          await removerImagemDoPost(post.id);
          final = { ...salvo, imagem_url: null };
        }
      } catch (falhaFoto) {
        // Mantém o editor aberto para a mensagem aparecer; salvar de novo só repete a foto.
        setErro(`O texto foi salvo, mas não foi possível atualizar a foto: ${falhaFoto instanceof ErroApi ? falhaFoto.message : "tente de novo."}`);
        return;
      }
      aoSalvar(final);
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
      <div className="space-y-2">
        {(urlPrevia || (!removerFoto && post.imagem_url)) && (
          <div className="relative">
            <img
              src={urlPrevia || urlDaImagem(post.imagem_url!)}
              alt={urlPrevia ? "Prévia da nova foto" : "Foto atual"}
              className="max-h-64 w-full rounded-controle object-cover ring-1 ring-linha"
            />
            <button
              type="button"
              onClick={limparFoto}
              aria-label="Remover foto"
              className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-superficie text-texto shadow-cartao ring-1 ring-linha transition-colors duration-[var(--rapido)] hover:bg-superficie-2 motion-reduce:transition-none"
            >
              <Icone nome="fechar" tamanho={16} />
            </button>
          </div>
        )}
        <input ref={entradaFoto} type="file" accept="image/*" className="sr-only" onChange={escolherFoto} />
        <div className="flex items-center gap-2">
          <Botao type="button" variante="fantasma" tamanho="sm" onClick={() => entradaFoto.current?.click()} disabled={salvando}>
            {(post.imagem_url && !removerFoto) || foto ? "Trocar foto" : "Adicionar foto"}
          </Botao>
          {((post.imagem_url && !removerFoto) || foto) && (
            <Botao type="button" variante="fantasma" tamanho="sm" onClick={limparFoto} disabled={salvando}>
              Remover foto
            </Botao>
          )}
        </div>
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
