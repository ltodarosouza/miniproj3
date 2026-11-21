"use client";

import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const BASE =
  "w-full rounded-controle border bg-superficie px-3 text-[0.9375rem] text-texto placeholder:text-texto-3 transition-[border-color,box-shadow] duration-[var(--rapido)] ease-saida focus:outline-none focus:border-marca focus:shadow-[0_0_0_4px_var(--brilho)]";

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
      <label htmlFor={id} className="text-sm font-medium text-texto">
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
  className = "",
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & { rotulo: string; dica?: string; erro?: string }) {
  const id = useId();
  return (
    <Rotulo id={id} rotulo={rotulo} dica={dica} erro={erro}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || dica ? `${id}-msg` : undefined}
        className={`${BASE} h-10 ${erro ? "border-perigo" : "border-linha-forte"} ${className}`}
        {...resto}
      />
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
