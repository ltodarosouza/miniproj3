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
    <form className="border-t border-linha p-3" onSubmit={(evento) => { evento.preventDefault(); enviar(); }}>
      <div className="flex items-end gap-2">
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
          className="max-h-[120px] min-h-10 flex-1 resize-none rounded-controle border border-linha-forte bg-superficie px-3 py-2.5 text-[0.9375rem] leading-relaxed text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)] focus:outline-none disabled:opacity-50"
        />
        <button type="submit" aria-label="Enviar mensagem" disabled={!habilitada} className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-[var(--rapido)] ease-saida motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca ${habilitada ? "scale-100 bg-marca text-white" : "scale-95 bg-transparent text-texto-3"}`}>
          <IconeEnviar tamanho={20} />
        </button>
      </div>
      <div className="flex min-h-5 items-center justify-end px-1 pt-1">
        {texto.length >= 900 && <span className="numeros text-xs text-texto-3">{texto.length}/1000</span>}
      </div>
    </form>
  );
}
