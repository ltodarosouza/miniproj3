"use client";

import { useEffect, useState } from "react";

const TAMANHOS = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl" } as const;

export function Avatar({
  nome,
  url,
  tamanho = "md",
}: {
  nome: string;
  url?: string | null;
  tamanho?: keyof typeof TAMANHOS;
}) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  useEffect(() => setImagemFalhou(false), [url]);

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
    <span className={`relative inline-flex shrink-0 [clip-path:polygon(50%_0,93.3%_25%,93.3%_75%,50%_100%,6.7%_75%,6.7%_25%)] ${TAMANHOS[tamanho]}`}>
      {src && !imagemFalhou ? (
        <img src={src} alt="" onError={() => setImagemFalhou(true)} className="size-full object-cover" />
      ) : (
        <span
          className="flex size-full items-center justify-center bg-superficie-2 font-mono font-medium text-texto-2"
        >
          {iniciais}
        </span>
      )}
    </span>
  );
}
