"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { Revelar } from "@/components/ui/Revelar";
import { formatarQuando } from "@/lib/datas";
import type { Comentario } from "@/lib/posts";

export function ListaComentarios({ comentarios }: { comentarios: Comentario[] }) {
  if (comentarios.length === 0) {
    return (
      <p className="text-sm text-texto-2">
        Ninguém comentou ainda. Tire uma dúvida ou deixe um incentivo.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-linha">
      {comentarios.map((comentario, i) => {
        const perfil = `/perfil/${encodeURIComponent(comentario.autor.username)}`;

        return (
          <li key={comentario.id} className="py-4 first:pt-0 last:pb-0">
            <Revelar atraso={Math.min(i, 6) * 40}>
              <article>
                <header className="flex min-w-0 items-center gap-3">
                  <Link href={perfil} aria-label={`Perfil de ${comentario.autor.name}`}>
                    <Avatar nome={comentario.autor.name} url={comentario.autor.avatar_url} tamanho="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={perfil} className="block truncate font-medium text-texto hover:underline">
                      {comentario.autor.name}
                    </Link>
                    <p className="truncate font-mono text-xs text-texto-3">
                      @{comentario.autor.username} ·{" "}
                      <time className="numeros" dateTime={comentario.created_at}>
                        {formatarQuando(comentario.created_at)}
                      </time>
                    </p>
                  </div>
                </header>
                <p className="mt-3 whitespace-pre-line break-words text-[0.9375rem] leading-relaxed text-texto">
                  {comentario.texto}
                </p>
              </article>
            </Revelar>
          </li>
        );
      })}
    </ol>
  );
}
