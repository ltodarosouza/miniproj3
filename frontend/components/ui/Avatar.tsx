"use client";

import { useEffect, useState } from "react";

const TAMANHOS = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl" } as const;

const MATIZES = [182, 160, 210, 55, 25, 280];

function matiz(texto: string): number {
  let soma = 0;
  for (const letra of texto) soma = (soma * 31 + letra.charCodeAt(0)) % 997;
  return MATIZES[soma % MATIZES.length];
}

export function Avatar({
  nome,
  url,
  tamanho = "md",
  online = false,
}: {
  nome: string;
  url?: string | null;
  tamanho?: keyof typeof TAMANHOS;
  online?: boolean;
}) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  useEffect(() => setImagemFalhou(false), [url]);

  const h = matiz(nome);
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const src = url?.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${url}`
    : url;

  return (
    <span className={`relative inline-flex shrink-0 ${TAMANHOS[tamanho]}`}>
      {src && !imagemFalhou ? (
        <img src={src} alt="" onError={() => setImagemFalhou(true)} className="size-full rounded-full object-cover ring-1 ring-linha" />
      ) : (
        <span
          className="flex size-full items-center justify-center rounded-full font-semibold"
          style={{
            background: `oklch(0.9 0.05 ${h})`,
            color: `oklch(0.35 0.08 ${h})`,
          }}
        >
          {iniciais}
        </span>
      )}
      {online && (
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-superficie bg-sucesso" />
      )}
    </span>
  );
}
