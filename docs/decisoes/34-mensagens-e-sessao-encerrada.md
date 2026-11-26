# 34. Mensagens e sessão encerrada

- **Contexto.** Na issue #84, as mensagens passaram a usar o sistema visual
  Colmatch. Sair em outra aba também podia deixar a conversa consultando o
  servidor ou levá-la ao login antes de mostrar o aviso de sessão encerrada.
- **Escolha.** A conversa usa os componentes compartilhados da identidade
  visual e o contrato de conversas com estado e contagem de não lidas. Ao
  receber `401`, ela para as consultas e oferece um link para entrar de novo.
  A política de `401` também considera a rota ativa para que uma consulta
  compartilhada da navegação possa falhar antes da consulta da conversa sem
  tirar a pessoa da tela. Fora da conversa, as outras páginas mantêm o fluxo
  de sessão anterior e o login continua exibindo erros de credenciais.
- **Rolagem.** Mensagens próprias levam a conversa ao fim. Mensagens recebidas
  e propostas seguem a distância até o fim, com aviso quando a pessoa está
  lendo mais acima. A animação respeita a preferência por movimento reduzido.
