import { useCallback, useEffect, useRef } from "react";

import { trocasPendentesAvaliacao, type Troca } from "@/lib/api";
import { meuId } from "@/lib/sessao";

// Avisa as outras partes da tela (selo de Mensagens, lista de conversas) que uma avaliação de troca
// foi enviada, para elas buscarem de novo as pendentes sem esperar o próximo ciclo de polling.
export const EVENTO_AVALIACAO_ENVIADA = "troca:avaliacao-enviada";

export function avisarAvaliacaoEnviada() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_AVALIACAO_ENVIADA));
}

// Mantém uma consulta por vez; eventos forçados invalidam a resposta atual e agendam outra.
export function useConsultaPendentes(aplicar: (trocas: Troca[]) => void): (forcar?: boolean) => void {
  const aplicarRef = useRef(aplicar);
  const montado = useRef(true);
  const emVoo = useRef(false);
  const geracao = useRef(0);
  const deNovo = useRef(false);
  aplicarRef.current = aplicar;

  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  return useCallback((forcar = false) => {
    if (forcar) {
      geracao.current += 1;
      if (emVoo.current) {
        deNovo.current = true;
        return;
      }
    } else if (emVoo.current) {
      return;
    }
    if (!meuId()) return;

    const executar = () => {
      if (emVoo.current || !meuId()) return;
      emVoo.current = true;
      const geracaoConsulta = geracao.current;
      void trocasPendentesAvaliacao()
        .then((resposta) => {
          if (montado.current && geracaoConsulta === geracao.current) aplicarRef.current(resposta.items);
        })
        .catch(() => {})
        .finally(() => {
          emVoo.current = false;
          if (deNovo.current && montado.current) {
            deNovo.current = false;
            executar();
          }
        });
    };

    executar();
  }, []);
}
