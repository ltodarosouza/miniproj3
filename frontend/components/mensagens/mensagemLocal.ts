import type { Mensagem } from "@/lib/api";

export type MensagemLocal = Mensagem & {
  entregue_em?: string | null;
  lida_em?: string | null;
  estado?: "enviando" | "falhou";
  idLocal?: number;
};

export function confirmarEnvio(atuais: MensagemLocal[], idLocal: number, enviada: Mensagem): MensagemLocal[] {
  const realComIdLocal = atuais.find((mensagem) => mensagem.id === enviada.id && mensagem.idLocal !== undefined);
  const realExistente = atuais.find((mensagem) => mensagem.id === enviada.id);
  const temporaria = atuais.find((mensagem) => mensagem.idLocal === idLocal && mensagem.id < 0);

  if (realExistente) {
    const preferida = realComIdLocal ?? realExistente;
    return atuais.filter((mensagem) => {
      if (mensagem.id === enviada.id) return mensagem === preferida;
      return mensagem.idLocal !== idLocal || mensagem.id >= 0;
    });
  }

  if (temporaria) {
    return atuais.map((mensagem) => mensagem === temporaria ? { ...enviada, idLocal } : mensagem);
  }

  return [...atuais, { ...enviada, idLocal }];
}
