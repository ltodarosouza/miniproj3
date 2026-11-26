type PropriedadesSeloContador = { total: number | null; className?: string };

export function SeloContador({ total, className = "" }: PropriedadesSeloContador) {
  if (total === null || total <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] bg-selo px-1 font-mono text-[0.6875rem] font-medium leading-none text-selo-texto numeros ring-2 ring-superficie ${className}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
