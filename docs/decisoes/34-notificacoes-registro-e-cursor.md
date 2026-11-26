# 34. Notificações como registro de atividade, com cursor temporal no front

- **Contexto:** issue #85, na direção "Bolsa de saberes" (#78). A página
  `/notificacoes` era uma pilha de cartões com fundo colorido nas não lidas,
  e o "Carregar mais" pedia `offset=<quantas já vieram>`. Como a lista é
  montada a cada request (decisão 21), uma curtida que chega durante a rolagem
  empurra tudo um degrau: a página 2 repete um item e esconde outro (auditoria
  F6). O backend que aceita `antes_de` é a #75, que ainda não tinha entrado
  quando esta issue foi feita.
- **Opções:** esperar a #75 para mexer na paginação; mandar só `antes_de` e
  aceitar que, sem a #75, a página 2 viesse igual à 1; ou mandar `antes_de`
  e cair para `offset` quando o backend não o entende.
- **Escolha:** `listarNotificacoesAntesDe` pede `antes_de` com o horário do
  último item exibido acrescido de um microssegundo. O filtro estrito do
  servidor inclui assim os itens empatados, e o front remove os já exibidos
  pela chave `tipo-em-ator-post-troca`. A função busca um item além do limite
  da página para saber se ainda há algo a carregar.
  Se o backend antigo ignorar o cursor, ou os empates já exibidos ocuparem
  a resposta e impedirem essa checagem, a função percorre páginas por posição
  desde o início, mantendo apenas itens inéditos no limite temporal. A
  varredura ainda pode sofrer deslocamentos se a lista mudar entre suas
  requisições, pois a API não oferece um snapshot.
  O visual virou registro: rótulo numerado em mono por grupo (`01 · Hoje`),
  linhas separadas por régua, horário em mono numa coluna à esquerda (hora e,
  fora de hoje, o dia), avatar, texto e ação à direita. A não lida tem uma
  barra de 2 px em `--marca`, sem fundo. O toast é um bloco grafite de raio 4
  com a sombra curta, e o aviso de avaliação virou uma folha da ordem
  (`Ordem #N`, o par ensinou ⇄ aprendeu com régua, estrelas e recado).
- **Tokens:** a #78 ainda não tinha entrado. As telas usam os nomes de token
  atuais (`--marca`, `--linha`, `--sombra-alta`...), que a #78 só troca de
  valor, e os tokens novos com fallback: `var(--grafite, var(--texto))` e
  `var(--grafite-texto, var(--fundo))`. Quando a #78 entrar, as cores viram
  mel e grafite sem mudar estes arquivos.
- **O que cortamos e por quê:** "Ver post" some no celular, porque lá a linha
  inteira já é o link e o texto precisava do espaço.
