type Tipo = "sei" | "quero" | "quero_aprender" | "neutra";

const ESTILOS: Record<Tipo, string> = {
  sei: "bg-marca-suave text-marca-forte border-transparent",
  quero: "bg-transparent text-texto-2 border-dashed border-linha-forte",
  quero_aprender: "bg-transparent text-texto-2 border-dashed border-linha-forte",
  neutra: "bg-superficie-2 text-texto-2 border-transparent",
};

export function TagHabilidade({
  nome,
  tipo = "neutra",
  nivel,
  destaque = false,
}: {
  nome: string;
  tipo?: Tipo;
  nivel?: number;
  destaque?: boolean;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-[2px] border px-1.5 font-mono text-[0.75rem] font-medium leading-none ${
        destaque ? "bg-marca text-marca-texto border-transparent" : ESTILOS[tipo]
      }`}
    >
      {nome}
      {nivel !== undefined && (
        <span className="flex gap-0.5" aria-label={`nível ${nivel} de 5`} role="img">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`size-1 ${n <= nivel ? "bg-current" : "bg-current opacity-25"}`}
            />
          ))}
        </span>
      )}
    </span>
  );
}
