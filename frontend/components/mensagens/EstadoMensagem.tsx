import type { MensagemLocal } from "@/components/mensagens/mensagemLocal";

export function EstadoMensagem({ mensagem }: { mensagem: MensagemLocal }) {
  if (mensagem.estado === "enviando") {
    return <><svg aria-hidden="true" className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.2 1.4" /></svg><span className="sr-only">Enviando</span></>;
  }
  if (mensagem.estado === "falhou") {
    return <span className="sr-only">Não enviada</span>;
  }
  if (mensagem.id < 0) return null;

  const vista = Boolean(mensagem.lida_em);
  const entregue = vista || Boolean(mensagem.entregue_em);
  const rotulo = vista ? "Vista" : entregue ? "Entregue" : "Enviada";
  const cor = vista ? "text-marca-forte" : entregue ? "text-texto-3" : "text-texto-3";

  return (
    <span className={`inline-flex transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${cor}`}>
      {entregue ? (
        <svg aria-hidden="true" className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m1.8 8.2 3.1 3.1 6.9-7" />{vista && <path d="m7.3 8.2 3.1 3.1 4-4.2" />}</svg>
      ) : (
        <svg aria-hidden="true" className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m2.5 8.2 3.1 3.1 7.9-7" /></svg>
      )}
      <span className="sr-only">{rotulo}</span>
    </span>
  );
}
