type Tipo = "sei" | "quero_aprender" | "neutra";

const ESTILOS: Record<Tipo, string> = {
  sei: "bg-marca-suave text-marca-forte border-transparent",
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
      className={`inline-flex h-7 items-center gap-2 rounded-full border px-2.5 text-[0.8125rem] font-medium ${
        destaque ? "bg-troca-suave text-texto border-transparent ring-1 ring-troca" : ESTILOS[tipo]
      }`}
    >
      {nome}
      {nivel !== undefined && (
        <span className="flex gap-0.5" aria-label={`nível ${nivel} de 5`} role="img">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`size-1.5 rounded-full ${n <= nivel ? "bg-current" : "bg-current opacity-20"}`}
            />
          ))}
        </span>
      )}
    </span>
  );
}
