# 28. Troca só avalia o que aconteceu

- **Contexto:** issue #74, auditoria F2 e F3. Era possível confirmar uma
  proposta cujo horário já passou e avaliar sem encontro, inflando a reputação.
  A mesma pessoa também podia empilhar N propostas pendentes para o mesmo par:
  N cartões, N não lidas e N notificações.
- **Opções:** bloquear só na avaliação; bloquear a confirmação depois do
  horário; ou deixar o fluxo livre.
- **Escolha:** uma proposta só pode ser confirmada antes do horário. E só
  pode haver uma proposta pendente por par, em qualquer direção. Recusar segue
  permitido depois do horário.
- **O que cortamos e por quê:** checagem de pendência no banco com índice único
  parcial. A validação fica na aplicação: o volume é pequeno e SQLite e
  Postgres exigiriam sintaxes diferentes. Uma corrida de dois `POST`s
  simultâneos do mesmo par é um risco baixo aceito.
- **Como ficou:**
  - `POST /trocas/{id}/confirmar` com `data_hora` já passada responde **422**:
    `"o horário desta proposta já passou, proponha outra"`. Recusar continua
    permitido depois do horário. Uma troca já respondida continua dando **409**:
    `"esta proposta já foi respondida"`.
  - `POST /trocas` com outra troca de status `proposta` entre as mesmas duas
    pessoas responde **409**. Se a pendente foi proposta por quem está tentando
    criar outra: `"já existe uma proposta sua aguardando resposta"`. Se veio da
    outra pessoa: `"esta pessoa já te enviou uma proposta, responda antes de
    propor outra"`. Depois de recusar ou confirmar, propor de novo dá **201**.
  - O corpo do erro segue o padrão do FastAPI: `{"detail": "..."}`. O front
    mostra a mensagem no cartão ou formulário (issue #86).

  Esta decisão reescreve a decisão 8: a avaliação só vale para troca confirmada
  antes do horário. Também reescreve a decisão 17: só há uma proposta pendente por
  par.
