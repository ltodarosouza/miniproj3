"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/Avatar";
import { BotaoLink } from "@/components/ui/Botao";
import { BotaoSeguir } from "@/components/ui/BotaoSeguir";
import { formatarQuando } from "@/lib/datas";
import { linkDaNotificacao, type Notificacao } from "@/lib/notificacoes";

export function ItemNotificacao({ notificacao }: { notificacao: Notificacao }) {
  const link = linkDaNotificacao(notificacao);

  return (
    <div
      className={`flex items-center gap-3 rounded-cartao p-3 ${
        notificacao.lida ? "bg-transparent hover:bg-superficie-2" : "bg-marca-suave"
      }`}
    >
      <Link href={link} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar nome={notificacao.ator.name} url={notificacao.ator.avatar_url} />
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-texto">{notificacao.texto_curto}</span>
          <time dateTime={notificacao.em} className="block text-xs text-texto-3">
            {formatarQuando(notificacao.em)}
          </time>
          {!notificacao.lida && <span className="sr-only">Não lida</span>}
        </span>
      </Link>
      {notificacao.tipo === "seguidor" && (
        <BotaoSeguir username={notificacao.ator.username} tamanho="sm" />
      )}
      {notificacao.tipo === "troca_proposta" && (
        <BotaoLink href={link} tamanho="sm" variante="troca">
          Ver proposta
        </BotaoLink>
      )}
    </div>
  );
}
