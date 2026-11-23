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

export function chaveMensagem(mensagem: MensagemLocal, outroUsername: string): string {
  if (!mensagem.cliente_id) return `id:${mensagem.id}`;
  const lado = mensagem.id < 0 || mensagem.de_username !== outroUsername ? "eu" : "outro";
  return `${lado}:${mensagem.cliente_id}`;
}

export function reconciliarMensagens(atuais: MensagemLocal[], recebidas: MensagemLocal[], outroUsername: string): MensagemLocal[] {
  const resultado = [...atuais];
  for (const recebida of recebidas) {
    const porId = resultado.findIndex((mensagem) => mensagem.id === recebida.id);
    const chave = chaveMensagem(recebida, outroUsername);
    const porCliente = recebida.cliente_id ? resultado.findIndex((mensagem) => chaveMensagem(mensagem, outroUsername) === chave) : -1;
    const indice = porId >= 0 ? porId : porCliente;
    if (indice >= 0) {
      const existente = resultado[indice];
      resultado[indice] = { ...existente, ...recebida, estado: undefined, entregue_em: recebida.entregue_em ?? existente.entregue_em, lida_em: recebida.lida_em ?? existente.lida_em, idLocal: existente.idLocal };
    } else {
      resultado.push(recebida);
    }
  }
  const ids = new Set<number>();
  const chaves = new Set<string>();
  return resultado.filter((mensagem) => {
    const chave = chaveMensagem(mensagem, outroUsername);
    if (ids.has(mensagem.id) || chaves.has(chave)) return false;
    ids.add(mensagem.id);
    chaves.add(chave);
    return true;
  });
}

export function confirmarEnvio(atuais: MensagemLocal[], clienteId: string, enviada: MensagemLocal, outroUsername: string): MensagemLocal[] {
  return reconciliarMensagens(atuais, [{ ...enviada, cliente_id: enviada.cliente_id ?? clienteId }], outroUsername);
}

export function aplicarEntreguesAte(atuais: MensagemLocal[], id: number | null | undefined, outroUsername: string): MensagemLocal[] {
  if (id == null || id <= 0) return atuais;
  const precisaAtualizar = atuais.some((mensagem) => mensagem.de_username !== outroUsername && mensagem.id > 0 && mensagem.id <= id && !mensagem.entregue_em);
  if (!precisaAtualizar) return atuais;
  return atuais.map((mensagem) => mensagem.de_username !== outroUsername && mensagem.id > 0 && mensagem.id <= id && !mensagem.entregue_em ? { ...mensagem, entregue_em: mensagem.em } : mensagem);
}
