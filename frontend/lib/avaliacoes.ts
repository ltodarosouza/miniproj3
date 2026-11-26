// Avisa as outras partes da tela (selo de Mensagens, lista de conversas) que uma avaliação de troca
// foi enviada, para elas buscarem de novo as pendentes sem esperar o próximo ciclo de polling.
export const EVENTO_AVALIACAO_ENVIADA = "troca:avaliacao-enviada";

export function avisarAvaliacaoEnviada() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_AVALIACAO_ENVIADA));
}
