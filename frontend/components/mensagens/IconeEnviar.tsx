export function IconeEnviar({ tamanho = 20, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21 3-7.2 18-3.5-7.3L3 10.2 21 3Z" />
      <path d="M10.3 13.7 21 3" />
    </svg>
  );
}
