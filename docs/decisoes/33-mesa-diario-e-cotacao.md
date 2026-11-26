# 33. Mesa, Diário e cotação da semana

- **Contexto.** A issue #81 leva o feed para a identidade Bolsa de saberes
  (decisão 32). O feed era uma pilha de cartões com sombra, igual a qualquer
  rede social, e a coluna lateral repetia o mesmo cartão três vezes.
- **Escolha.** A tela passa a se chamar Mesa: é onde o estudante vê o que foi
  estudado. O topo traz o título, a data de hoje em mono e uma linha com a
  cotação da semana. A lista vira o Diário: cada post é uma linha de registro
  com a hora numa coluna à esquerda, separada da próxima por uma régua. Tempo
  estudado e habilidade ficam numa linha de dados em mono, logo abaixo do
  texto. "Pode te ensinar" e "Estuda o mesmo que você" saem do canto do cartão
  e viram um rótulo mono acima da linha.
- **Coluna.** Três blocos numerados, só com régua e título mono:
  `01 · Sua semana` mostra as horas da semana em mono grande e a sequência em
  7 segmentos; `02 · Cotação` é uma tabela Habilidade, Horas e Posts com
  números tabulares; `03 · Pode te ensinar` é uma lista curta com quem ensina
  o quê e o atalho para conversar.
- **Dados.** Tudo vem de rotas que já existiam: `GET /feed/em-alta` para a
  cotação e `GET /feed/meu-progresso` para a semana. Não há histórico de semanas
  anteriores, então a seta da cotação no topo não compara com a semana passada:
  ela indica a posição no ranking (metade de cima ▲, metade de baixo ▼). O
  leitor de tela ouve a posição, não a seta.
- **Curtida.** Um segundo clique enquanto a primeira curtida ainda está no
  servidor é ignorado. Antes, dois cliques rápidos podiam deixar o contador
  diferente do servidor. O coração curtido usa mel e as animações ficaram mais
  curtas e discretas.
- **Composer.** Fechado, é um campo de uma linha com o botão "Registrar
  estudo". Ao abrir, mostra o formulário completo, com habilidade, tempo e foto.
