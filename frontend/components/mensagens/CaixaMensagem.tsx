"use client";

import { useRef, useState, type CompositionEvent, type KeyboardEvent } from "react";

import { IconeEnviar } from "@/components/mensagens/IconeEnviar";

export function CaixaMensagem({ aoEnviar, desabilitada = false }: { aoEnviar: (texto: string) => void; desabilitada?: boolean }) {
  const [texto, setTexto] = useState("");
  const campo = useRef<HTMLTextAreaElement>(null);
  const compondo = useRef(false);
  const habilitada = Boolean(texto.trim()) && !desabilitada;

  function ajustarAltura() {
    const elemento = campo.current;
    if (!elemento) return;
    elemento.style.height = "auto";
    elemento.style.height = `${Math.min(elemento.scrollHeight, 120)}px`;
  }

  function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || desabilitada) return;
    setTexto("");
    if (campo.current) campo.current.style.height = "auto";
    campo.current?.focus();
    aoEnviar(conteudo);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === "Enter" && !evento.shiftKey && !evento.nativeEvent.isComposing && !compondo.current) {
      evento.preventDefault();
      enviar();
    }
  }

  function aoIniciarComposicao(_evento: CompositionEvent<HTMLTextAreaElement>) {
    compondo.current = true;
  }

  function aoTerminarComposicao() {
    compondo.current = false;
  }

  return (
    <form className="flex items-center gap-2 border-t border-linha bg-superficie px-3 py-2" onSubmit={(evento) => { evento.preventDefault(); enviar(); }}>
      <textarea
        ref={campo}
        aria-label="Mensagem"
        placeholder="Escreva uma mensagem"
        value={texto}
        maxLength={1000}
        rows={1}
        disabled={desabilitada}
        onChange={(evento) => { setTexto(evento.target.value); ajustarAltura(); }}
        onKeyDown={aoTeclar}
        onCompositionStart={aoIniciarComposicao}
        onCompositionEnd={aoTerminarComposicao}
        className="min-h-10 max-h-[120px] flex-1 resize-none rounded-[4px] border border-linha-forte bg-superficie px-3 py-2 text-[0.9375rem] leading-normal text-texto placeholder:text-texto-3 transition-colors duration-[var(--rapido)] ease-saida focus:border-marca focus:outline-none focus:ring-1 focus:ring-marca disabled:opacity-50"
      />
      {texto.length >= 900 && <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-texto-3">{texto.length}/1000</span>}
      <button type="submit" aria-label="Enviar mensagem" disabled={!habilitada} className={`flex size-10 shrink-0 items-center justify-center rounded-[4px] transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ${habilitada ? "bg-marca text-marca-texto hover:opacity-90" : "border border-linha bg-transparent text-texto-3"}`}>
        <IconeEnviar tamanho={18} />
      </button>
    </form>
  );
}
