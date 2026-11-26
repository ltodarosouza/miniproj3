### 34. A proposta de troca vira uma ordem numerada, e confirmar celebra

- **Contexto:** a troca é o momento mais importante do produto, mas o cartão
  parecia uma mensagem qualquer: título solto, habilidades em pílulas e um
  quadrado de ícone decorativo. A decisão 20 previa confete e vibração ao
  confirmar, e o `celebrar()` nunca foi chamado no cartão (auditoria F19).
- **Opções:** manter o cartão e só chamar o confete; criar um status
  "concluída" no backend; tratar a proposta como uma ordem (comprovante)
  montada no frontend com os dados que já existem.
- **Escolha:** ordem montada no frontend. O número `#TR-0042` sai do `id`,
  e o status "concluída" é uma troca confirmada cuja data já passou
  (`statusDaOrdem` em `lib/trocas.ts`). O backend continua com
  `proposta | confirmada | recusada`.
- **O que cortamos e por quê:** um status novo no banco. Ele precisaria de
  migração e de alguém que o marcasse; a data já diz se a troca aconteceu.
- **Como ficou:**
  - `CartaoTroca`: número em mono, status com ponto colorido (aberta = mel,
    confirmada = sucesso, concluída = texto-2, recusada = perigo), as duas
    pernas ("Henry ensina → Git") com régua e o nó de match no meio, data
    em mono ("qui 27 nov · 19:00 · em 2 dias") e Confirmar/Recusar. Os
    erros 422/409 do backend aparecem como alerta logo abaixo das ações,
    com a primeira letra maiúscula.
  - Confirmar com sucesso chama `celebrar()` e `vibrar(10)`. O confete
    agora são 40 hexágonos mel e grafite em 1,1 s; com
    `prefers-reduced-motion` nada é desenhado. As cores leem `--marca`
    (mel) e `--grafite`, definidos nos temas claro e escuro.
  - `FormAgendarTroca`: blocos `01 · Você ensina`, `02 · Você aprende`,
    `03 · Quando`, horários em grade mono (4 colunas no celular, 6 no
    computador) e o resumo da ordem sempre visível antes de "Propor troca".
  - O nó de match usa o ícone `par` do sistema visual. O ponto da ordem
    aberta usa `--troca`, alias de `--marca`.
