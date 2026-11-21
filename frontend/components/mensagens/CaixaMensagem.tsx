"use client";

import { useRef, useState, type CompositionEvent, type KeyboardEvent } from "react";

import { Botao } from "@/components/ui/Botao";
import { Icone } from "@/components/ui/Icone";

export function CaixaMensagem({ aoEnviar, desabilitada = false }: { aoEnviar: (texto: string) => Promise<void>; desabilitada?: boolean }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const compondo = useRef(false);

  function ajustarAltura() {
    const elemento = campo.current;
    if (!elemento) return;
    elemento.style.height = "auto";
    elemento.style.height = `${Math.min(elemento.scrollHeight, 120)}px`;
  }

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || carregando || desabilitada) return;
    setCarregando(true);
    setErro("");
    try {
      await aoEnviar(conteudo);
      setTexto("");
      if (campo.current) campo.current.style.height = "auto";
      campo.current?.focus();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível enviar. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing && !compondo.current) {
      evento.preventDefault();
      void enviar();
    }
  }

  function aoIniciarComposicao(_evento: CompositionEvent<HTMLTextAreaElement>) {
    compondo.current = true;
  }

  function aoTerminarComposicao() {
    compondo.current = false;
  }

  return (
    <form className="border-t border-linha p-3" onSubmit={(evento) => { evento.preventDefault(); void enviar(); }}>
      <div className="flex items-end gap-2">
        <textarea
          ref={campo}
          aria-label="Mensagem"
          placeholder="Escreva uma mensagem"
          value={texto}
          maxLength={1000}
          rows={1}
          disabled={desabilitada}
          onChange={(evento) => { setTexto(evento.target.value); setErro(""); ajustarAltura(); }}
          onKeyDown={aoTeclar}
          onCompositionStart={aoIniciarComposicao}
          onCompositionEnd={aoTerminarComposicao}
          className="max-h-[120px] min-h-10 flex-1 resize-none rounded-controle border border-linha-forte bg-superficie px-3 py-2.5 text-[0.9375rem] leading-relaxed text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none disabled:opacity-50"
        />
        <Botao type="submit" className="size-10 shrink-0 rounded-full p-0" aria-label="Enviar mensagem" disabled={!texto.trim() || carregando || desabilitada} carregando={carregando}>
          {!carregando && <Icone nome="enviar" tamanho={18} />}
        </Botao>
      </div>
      <div className="flex min-h-5 items-center justify-between px-1 pt-1">
        {erro ? <p role="alert" className="text-sm text-perigo">{erro}</p> : <span />}
        {texto.length >= 900 && <span className="numeros text-xs text-texto-3">{texto.length}/1000</span>}
      </div>
    </form>
  );
}
