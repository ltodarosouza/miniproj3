type PropriedadesSeloContador = { total: number | null; className?: string };

export function SeloContador({ total, className = "" }: PropriedadesSeloContador) {
  if (total === null || total <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-selo px-1.5 text-xs font-semibold leading-none text-selo-texto numeros ring-2 ring-superficie ${className}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
