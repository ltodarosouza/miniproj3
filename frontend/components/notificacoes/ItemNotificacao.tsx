"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { BotaoLink } from "@/components/ui/Botao";
import { BotaoSeguirDeVolta } from "@/components/notificacoes/BotaoSeguirDeVolta";
import { horarioDaNotificacao, linkDaNotificacao, type Notificacao } from "@/lib/notificacoes";

export function ItemNotificacao({ notificacao }: { notificacao: Notificacao }) {
  const link = linkDaNotificacao(notificacao);
  const { hora, dia } = horarioDaNotificacao(notificacao.em);

  return (
    <div className="relative flex min-h-14 items-center gap-3 py-3 pl-3 pr-1">
      {!notificacao.lida && (
        <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 bg-marca" />
      )}
      <time
        dateTime={notificacao.em}
        className="w-12 shrink-0 font-mono text-xs leading-tight tabular-nums text-texto-3"
      >
        {hora}
        {dia !== null && <span className="block">{dia}</span>}
      </time>
      <Link href={link} className="group flex min-w-0 flex-1 items-center gap-3">
        <Avatar nome={notificacao.ator.name} url={notificacao.ator.avatar_url} />
        <span className="line-clamp-2 min-w-0 flex-1 text-sm text-texto group-hover:underline">
          {notificacao.texto_curto}
          {!notificacao.lida && <span className="sr-only">Não lida</span>}
        </span>
      </Link>
      {notificacao.tipo === "seguidor" && (
        <span className="shrink-0">
          <BotaoSeguirDeVolta username={notificacao.ator.username} nome={notificacao.ator.name} />
        </span>
      )}
      {notificacao.tipo === "troca_proposta" && (
        <span className="shrink-0">
          <BotaoLink href={link} tamanho="sm" variante="secundario">
            Ver proposta
          </BotaoLink>
        </span>
      )}
      {(notificacao.tipo === "curtida" || notificacao.tipo === "comentario") && (
        <span className="hidden shrink-0 sm:block">
          <BotaoLink
            href={link}
            tamanho="sm"
            variante="fantasma"
            aria-label={`Ver post: ${notificacao.texto_curto}`}
          >
            Ver post
          </BotaoLink>
        </span>
      )}
    </div>
  );
}
