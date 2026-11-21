import type { Mensagem } from "@/lib/api";
import { formatarHora } from "@/lib/datas";

export function BalaoMensagem({
  mensagem,
  minha,
  mostrarHora,
  agrupadaComAnterior,
}: {
  mensagem: Mensagem;
  minha: boolean;
  mostrarHora: boolean;
  agrupadaComAnterior: boolean;
}) {
  return (
    <div className={`flex ${minha ? "justify-end" : "justify-start"} ${agrupadaComAnterior ? "mt-1" : "mt-3"}`}>
      <div className={`max-w-[75%] ${minha ? "items-end" : "items-start"} flex flex-col`}>
        <p className={`whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[0.9375rem] leading-relaxed ${minha ? "rounded-br-md bg-marca-suave text-texto" : "rounded-bl-md bg-superficie-2 text-texto"}`}>
          {mensagem.texto}
        </p>
        {mostrarHora && <time className="numeros mt-1 px-1 text-[0.6875rem] text-texto-3">{formatarHora(mensagem.em)}</time>}
      </div>
    </div>
  );
}
