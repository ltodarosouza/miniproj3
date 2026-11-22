"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { Botao } from "@/components/ui/Botao";
import { AreaTexto } from "@/components/ui/Campo";
import { ErroApi } from "@/lib/api";
import { LIMITE_TEXTO_COMENTARIO } from "@/lib/posts";

export function CaixaComentario({ aoComentar }: { aoComentar: (texto: string) => Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const formulario = useRef<HTMLDivElement>(null);
  const compondo = useRef(false);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      await aoComentar(conteudo);
      setTexto("");
      formulario.current?.querySelector("textarea")?.focus();
    } catch (falha) {
      setErro(falha instanceof ErroApi ? falha.message : "Não deu para comentar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      evento.key === "Enter" &&
      !evento.shiftKey &&
      !evento.nativeEvent.isComposing &&
      !compondo.current
    ) {
      evento.preventDefault();
      void enviar();
    }
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        void enviar();
      }}
      className="space-y-3"
    >
      <div ref={formulario}>
        <AreaTexto
          rotulo="Comentar"
          placeholder="Escreva um comentário"
          rows={2}
          maxLength={LIMITE_TEXTO_COMENTARIO}
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setErro("");
          }}
          onKeyDown={aoTeclar}
          onCompositionStart={() => {
            compondo.current = true;
          }}
          onCompositionEnd={() => {
            compondo.current = false;
          }}
        />
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        {erro ? <p role="alert" className="text-sm text-perigo">{erro}</p> : <span />}
        <div className="flex shrink-0 items-center gap-3">
          {texto.length >= 450 && (
            <span className="numeros text-xs text-texto-3">
              {texto.length}/{LIMITE_TEXTO_COMENTARIO}
            </span>
          )}
          <Botao type="submit" tamanho="sm" carregando={enviando} disabled={!texto.trim()}>
            Comentar
          </Botao>
        </div>
      </div>
    </form>
  );
}
