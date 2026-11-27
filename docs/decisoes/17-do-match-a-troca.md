# 17. Do match à troca: horário por toque, habilidades do par e Meet pelo Google Agenda

- **Contexto:** no teste de 22/11 vieram quatro relatos: digitar a data
  inteira no agendamento, os campos "Você ensina/aprende" listando o catálogo
  inteiro, um campo de link da chamada que ninguém sabia preencher e quem já
  conversa continuar aparecendo em Matches.
- **Opções:** manter os campos nativos de data e hora ou um calendário próprio;
  filtrar as habilidades no front ou pedir ao backend; criar o Meet pela API
  do Google Agenda (OAuth) ou pelo link de template; esconder quem já conversa
  ou mover para uma seção própria.
- **Escolha:**
  - `SeletorDeHorario`: calendário do mês sempre aberto, atalhos "Hoje",
    "Amanhã" e "Sábado" e chips de horário de 08:00 a 22:00, de 30 em 30 min.
    Sem dependência nova, só `Intl.DateTimeFormat` e grade em CSS.
  - `GET /trocas/opcoes/{username}` devolve `eu_ensino` (o que eu sei e a
    pessoa quer aprender) e `eu_aprendo` (o que ela sabe e eu quero). O
    formulário mostra só esses chips, já marcados quando há uma opção só, e
    "Outra habilidade" abre o catálogo para combinar algo fora do perfil.
  - O formulário não tem mais link. O cartão da troca confirmada tem o botão
    principal "Agendar no Google Agenda", com a dica de clicar em "Adicionar
    videoconferência do Google Meet" e salvar.
  - `GET /matches` ganha `em_andamento`: quem já trocou mensagem ou tem troca
    comigo sai de `troca` e `pode_te_ensinar` e vai para uma seção recolhida.
    Troca recusada não conta: a pessoa volta para as seções principais.
- **O que cortamos e por quê:** criar o Meet automaticamente. O link de
  template do Google Agenda não cria a sala, e a API exige o OAuth que a
  decisão 2 cortou. `link_meet` continua no model (o seed usa), mas o
  formulário não envia mais e o backend ignora o campo.
- **Big O:** as opções fazem duas consultas, uma por pessoa, e cruzam os
  dicionários em O(h), sendo h o número de habilidades das duas. O
  `em_andamento` faz duas consultas extras (mensagens e trocas) limitadas aos
  candidatos do índice.
