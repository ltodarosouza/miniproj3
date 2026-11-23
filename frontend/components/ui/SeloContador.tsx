type PropriedadesSeloContador = { total: number | null; className?: string };

export function SeloContador({ total, className }: PropriedadesSeloContador) {
  if (total === null || total <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full px-1 text-[0.6875rem] font-semibold leading-none numeros ring-2 ring-superficie bg-perigo text-superficie${className ? ` ${className}` : ""}`}
    >
      {total > 99 ? "99+" : total}
    </span>
  );
}
