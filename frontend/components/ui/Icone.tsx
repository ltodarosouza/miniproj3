const CAMINHOS = {
  feed: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z",
  troca: "M7 7h11m0 0-3.5-3.5M18 7l-3.5 3.5M17 17H6m0 0 3.5-3.5M6 17l3.5 3.5",
  mensagem: "M5 5h14a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-8.5L6 20v-3.5H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  perfil: "M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM5 20c.8-3.4 3.6-5.25 7-5.25S18.2 16.6 19 20",
  coracao: "M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 6.8a4.25 4.25 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10z",
  estrela: "m12 3.8 2.45 5.1 5.6.7-4.1 3.85 1.05 5.55L12 16.3 7 19l1.05-5.55L3.95 9.6l5.6-.7z",
  comentario: "M20 11.5a7.5 7.5 0 0 1-11.1 6.6L4.5 19.5l1.4-4.2A7.5 7.5 0 1 1 20 11.5z",
  relogio: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-12.5V12l3 2",
  chama: "M12 20.5c3.6 0 6-2.4 6-5.7 0-3.9-3.4-5.6-4.3-9.3-.2-.8-1.2-1-1.6-.3-1 1.7-1.2 3.5-2.4 4.6-.3.3-.9.1-.9-.4V8.6c0-.6-.7-.9-1.1-.4C6.6 9.6 6 11.6 6 14.8c0 3.3 2.4 5.7 6 5.7z",
  mais: "M12 5v14M5 12h14",
  calendario: "M5 6.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1zM4 10.5h16M8.5 4v4M15.5 4v4",
  enviar: "M5 12 19.5 4.5 15 19.5l-3.25-6.25zm6.75 1.25L19.5 4.5",
  confirmar: "m5 12.5 4.5 4.5L19 7.5",
  fechar: "M6 6l12 12M18 6 6 18",
  link: "M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.1 1.1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.1-1.1",
  voltar: "M19 12H5m0 0 6-6m-6 6 6 6",
  arrastar: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

export function Icone({
  nome,
  tamanho = 20,
  preenchido = false,
  className = "",
}: {
  nome: NomeIcone;
  tamanho?: number;
  preenchido?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={preenchido ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={nome === "arrastar" ? 2.6 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}
