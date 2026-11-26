"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const BASE =
  "w-full rounded-controle border bg-superficie px-3 text-base md:text-[0.9375rem] text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:outline-none focus:border-marca focus:ring-2 focus:ring-marca/40";

function Rotulo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  erro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-texto-2">
        {rotulo}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-msg`} role="alert" className="text-sm text-perigo">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-msg`} className="text-sm text-texto-3">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

export function Campo({
  rotulo,
  dica,
  erro,
  acao,
  className = "",
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string;
  dica?: string;
  erro?: string;
  acao?: ReactNode;
}) {
  const id = useId();
  return (
    <Rotulo id={id} rotulo={rotulo} dica={dica} erro={erro}>
      <span className="relative block">
        <input
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro || dica ? `${id}-msg` : undefined}
          className={`${BASE} h-11 md:h-10 ${acao ? "pr-20" : ""} ${erro ? "border-perigo" : "border-linha-forte"} ${className}`}
          {...resto}
        />
        {acao && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{acao}</span>
        )}
      </span>
    </Rotulo>
  );
}

export function AreaTexto({
  rotulo,
  dica,
  erro,
  className = "",
  ...resto
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string; dica?: string; erro?: string }) {
  const id = useId();
  return (
    <Rotulo id={id} rotulo={rotulo} dica={dica} erro={erro}>
      <textarea
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || dica ? `${id}-msg` : undefined}
        className={`${BASE} min-h-24 resize-y py-2.5 leading-relaxed ${erro ? "border-perigo" : "border-linha-forte"} ${className}`}
        {...resto}
      />
    </Rotulo>
  );
}

export function Selecao({
  rotulo,
  dica,
  erro,
  className = "",
  children,
  ...resto
}: SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string; dica?: string; erro?: string }) {
  const id = useId();
  return (
    <Rotulo id={id} rotulo={rotulo} dica={dica} erro={erro}>
      <span className="relative block">
        <select
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro || dica ? `${id}-msg` : undefined}
          className={`${BASE} h-11 md:h-10 appearance-none pr-10 ${erro ? "border-perigo" : "border-linha-forte"} ${className}`}
          {...resto}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-texto-3"
        >
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Rotulo>
  );
}
