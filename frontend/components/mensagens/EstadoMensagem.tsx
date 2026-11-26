import type { MensagemLocal } from "@/components/mensagens/mensagemLocal";

export function EstadoMensagem({ mensagem }: { mensagem: MensagemLocal }) {
  if (mensagem.estado === "enviando") {
    return <span>Enviando…</span>;
  }
  if (mensagem.estado === "falhou") {
    return null;
  }
  if (mensagem.id < 0) return null;

  const vista = Boolean(mensagem.lida_em);
  const entregue = Boolean(mensagem.entregue_em);
  const rotulo = vista ? "Vista" : entregue ? "Entregue" : "Enviada";

  return (
    <span className={`transition-colors duration-[var(--rapido)] ease-saida motion-reduce:transition-none ${vista ? "text-marca-forte" : ""}`}>
      {rotulo}
    </span>
  );
}
