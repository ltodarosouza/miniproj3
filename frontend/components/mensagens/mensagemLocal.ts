import type { Mensagem } from "@/lib/api";

export type MensagemLocal = Mensagem & {
  cliente_id?: string | null;
  entregue_em?: string | null;
  lida_em?: string | null;
  estado?: "enviando" | "falhou";
  idLocal?: number;
};

export function maiorIdRecebido(mensagens: MensagemLocal[], cursorAtual: number): number {
  return mensagens.reduce((maior, mensagem) => Math.max(maior, mensagem.id), cursorAtual);
}

export function reconciliarMensagens(atuais: MensagemLocal[], recebidas: MensagemLocal[]): MensagemLocal[] {
  const resultado = [...atuais];
  for (const recebida of recebidas) {
    const porId = resultado.findIndex((mensagem) => mensagem.id === recebida.id);
    const porCliente = recebida.cliente_id ? resultado.findIndex((mensagem) => mensagem.cliente_id === recebida.cliente_id) : -1;
    const indice = porId >= 0 ? porId : porCliente;
    if (indice >= 0) {
      const existente = resultado[indice];
      resultado[indice] = { ...existente, ...recebida, idLocal: existente.idLocal };
    } else {
      resultado.push(recebida);
    }
  }
  const ids = new Set<number>();
  const clientes = new Set<string>();
  return resultado.filter((mensagem) => {
    if (ids.has(mensagem.id)) return false;
    if (mensagem.cliente_id && clientes.has(mensagem.cliente_id)) return false;
    ids.add(mensagem.id);
    if (mensagem.cliente_id) clientes.add(mensagem.cliente_id);
    return true;
  });
}

export function confirmarEnvio(atuais: MensagemLocal[], clienteId: string, enviada: MensagemLocal): MensagemLocal[] {
  return reconciliarMensagens(atuais, [{ ...enviada, cliente_id: enviada.cliente_id ?? clienteId }]);
}

export function aplicarEntreguesAte(atuais: MensagemLocal[], id: number | null | undefined, outroUsername: string): MensagemLocal[] {
  if (id == null || id <= 0) return atuais;
  const precisaAtualizar = atuais.some((mensagem) => mensagem.de_username !== outroUsername && mensagem.id > 0 && mensagem.id <= id && !mensagem.entregue_em);
  if (!precisaAtualizar) return atuais;
  return atuais.map((mensagem) => mensagem.de_username !== outroUsername && mensagem.id > 0 && mensagem.id <= id && !mensagem.entregue_em ? { ...mensagem, entregue_em: mensagem.em } : mensagem);
}
