import Link from "next/link";

import { formatarTempoEstudado, type HabilidadeEmAlta } from "@/lib/posts";

// Cotação da semana: habilidades com mais posts e horas registradas nos últimos 7 dias.
export function EmAlta({ habilidades }: { habilidades: HabilidadeEmAlta[] }) {
  if (!habilidades.length) {
    return <p className="text-sm text-texto-3">Ninguém marcou habilidade nos posts desta semana ainda.</p>;
  }
  return (
    <table className="w-full table-fixed text-sm">
      <caption className="sr-only">Habilidades mais estudadas nesta semana</caption>
      <thead>
        <tr className="border-b border-linha font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-texto-3">
          <th scope="col" className="py-1.5 text-left font-normal">Habilidade</th>
          <th scope="col" className="w-16 py-1.5 text-right font-normal">Horas</th>
          <th scope="col" className="w-12 py-1.5 text-right font-normal">Posts</th>
        </tr>
      </thead>
      <tbody>
        {habilidades.map((h) => (
          <tr key={h.id} className="border-b border-linha last:border-b-0">
            <th scope="row" className="py-2 text-left font-medium">
              <Link href={`/busca/habilidades/${h.id}`} className="block truncate text-texto hover:underline">
                {h.nome}
              </Link>
            </th>
            <td className="py-2 text-right font-mono text-texto-2 numeros">
              {h.minutos > 0 ? formatarTempoEstudado(h.minutos) : "–"}
            </td>
            <td className="py-2 text-right font-mono text-texto-2 numeros">{h.posts}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
