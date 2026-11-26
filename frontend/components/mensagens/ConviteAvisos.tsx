"use client";

import { useEffect, useState } from "react";

export function ConviteAvisos({ temConversas }: { temConversas: boolean }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!temConversas || typeof Notification === "undefined" || Notification.permission !== "default") return;
    try { setVisivel(localStorage.getItem("convite-avisos-dms") !== "dispensado"); } catch { setVisivel(true); }
  }, [temConversas]);
  if (!visivel) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-linha px-4 py-2 text-xs text-texto-2">
      <span>Quer ser avisado quando chegar mensagem?</span>
      <span className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          className="rounded-[2px] font-medium text-marca-forte hover:underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
          onClick={async () => { const resultado = await Notification.requestPermission(); setVisivel(resultado === "default"); }}
        >
          Ativar
        </button>
        <button
          type="button"
          className="rounded-[2px] text-texto-3 hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
          onClick={() => { try { localStorage.setItem("convite-avisos-dms", "dispensado"); } catch {} setVisivel(false); }}
        >
          Agora não
        </button>
      </span>
    </div>
  );
}
