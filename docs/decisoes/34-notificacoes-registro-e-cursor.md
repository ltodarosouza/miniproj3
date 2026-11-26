# 34. Notificações como registro de atividade, com cursor temporal no front

- **Contexto:** issue #85, na direção "Bolsa de saberes" (#78). A página
  `/notificacoes` era uma pilha de cartões com fundo colorido nas não lidas,
  e o "Carregar mais" pedia `offset=<quantas já vieram>`. Como a lista é
  montada a cada request (decisão 21), uma curtida que chega durante a rolagem
  empurra tudo um degrau: a página 2 repete um item e esconde outro (auditoria
  F6). Uma curtida no mesmo post e dia também pode mover um grupo ainda não
  exibido para cima da fronteira temporal.
- **Escolha:** a primeira página guarda o `proximo_cursor` devolvido pela
  #75. As páginas seguintes repassam o valor opaco em `cursor` até receberem
  `null`. O servidor mantém o recorte da primeira página, limita as
  curtidas antes de agrupá-las e desempata os eventos na mesma ordem em
  todas as páginas. Atividades novas aparecem no registro ao recarregar a
  primeira página e continuam sendo anunciadas pelo toast. Descurtidas
  durante a rolagem ainda podem mudar a composição de um grupo.
  O visual virou registro: rótulo numerado em mono por grupo (`01 · Hoje`),
  linhas separadas por régua, horário em mono numa coluna à esquerda (hora e,
  fora de hoje, o dia), avatar, texto e ação à direita. A não lida tem uma
  barra de 2 px em `--marca`, sem fundo. O toast é um bloco grafite de raio 4
  com a sombra curta, e o aviso de avaliação virou uma folha da ordem
  (`Ordem #N`, o par ensinou ⇄ aprendeu com régua, estrelas e recado).
- **Tokens:** as telas usam os tokens do sistema visual da #78.
  A barra usa `--marca`, o toast usa
  `--grafite` e `--grafite-texto` com `--sombra-alta`, e o aviso usa o cartão
  e as estrelas compartilhados. Horários e nomes de habilidades usam IBM
  Plex Mono.
- **O que cortamos e por quê:** "Ver post" some no celular, porque lá a linha
  inteira já é o link e o texto precisava do espaço.
