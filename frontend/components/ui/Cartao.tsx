import type { HTMLAttributes, ReactNode } from "react";

// Em "01 · Título", o número sai em mono e o título na fonte da interface.
function rotuloNumerado(rotulo: ReactNode): ReactNode {
  if (typeof rotulo !== "string") return rotulo;
  const partes = /^(\d{2}) · (.+)$/.exec(rotulo);
  if (!partes) return rotulo;
  return (
    <>
      <span className="font-mono font-medium numeros">{partes[1]}</span> · {partes[2]}
    </>
  );
}

export function Cartao({
  children,
  interativo = false,
  rotulo,
  className = "",
  ...resto
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  interativo?: boolean;
  rotulo?: string;
}) {
  return (
    <div
      className={`rounded-cartao border border-linha bg-superficie ${
        interativo
          ? "transition-colors duration-[var(--rapido)] ease-saida hover:border-linha-forte"
          : ""
      } ${className}`}
      {...resto}
    >
      {rotulo && (
        <header className="mb-3 border-b border-linha pb-2 text-[0.8125rem] font-semibold text-texto-2">
          {rotuloNumerado(rotulo)}
        </header>
      )}
      {children}
    </div>
  );
}
