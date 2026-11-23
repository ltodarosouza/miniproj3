"use client";

import { useEffect, useState } from "react";

import { Botao } from "@/components/ui/Botao";

export function ConviteAvisos({ temConversas }: { temConversas: boolean }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!temConversas || typeof Notification === "undefined" || Notification.permission !== "default") return;
    try { setVisivel(localStorage.getItem("convite-avisos-dms") !== "dispensado"); } catch { setVisivel(true); }
  }, [temConversas]);
  if (!visivel) return null;
  return <div className="flex flex-wrap items-center justify-between gap-2 border-b border-linha px-4 py-3 text-sm text-texto-2"><span>Quer ser avisado quando chegar mensagem?</span><span className="flex gap-2"><Botao tamanho="sm" onClick={async () => { const resultado = await Notification.requestPermission(); setVisivel(resultado === "default"); }}>Ativar</Botao><Botao tamanho="sm" variante="fantasma" onClick={() => { try { localStorage.setItem("convite-avisos-dms", "dispensado"); } catch {} setVisivel(false); }}>Agora não</Botao></span></div>;
}
