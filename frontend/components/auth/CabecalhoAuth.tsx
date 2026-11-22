import { Icone } from "@/components/ui/Icone";
import { NOME_REDE } from "@/lib/marca";

export function CabecalhoAuth({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="mb-6 text-center">
      <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-controle bg-marca text-marca-texto">
        <Icone nome="troca" tamanho={20} />
      </span>
      <p className="text-sm font-medium text-texto-3">{NOME_REDE}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-texto">{titulo}</h1>
      <p className="mt-2 text-sm leading-relaxed text-texto-2">{descricao}</p>
    </div>
  );
}
