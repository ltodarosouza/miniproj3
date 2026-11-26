# 40. Símbolo do Colmatch vira uma colmeia

Pedido direto do dono, sem issue.

- **Contexto.** O símbolo da #78 (decisão 32) eram três células: duas
  preenchidas e ligadas, e uma vazia. Pequeno, ele não lembrava uma colmeia,
  e o nome do app é Colmatch.
- **Opções.** Desenhar uma colmeia de palha (o domo com faixas), que fica
  ilegível em 16 px e não conversa com o resto do sistema; ou montar um favo
  de hexágonos, a mesma forma do avatar e do nó de match.
- **Escolha.** Favo de **sete células hexagonais** ("pointy-top": uma no
  centro e seis em volta, encaixadas com um vão uniforme) num quadro de
  40×40. A célula do centro é o "match" e vem em destaque: `currentColor` no
  componente (grafite no claro, creme no escuro), creme no favicon de fundo
  grafite e grafite a 55% no ícone de fundo mel. As outras seis usam
  `var(--marca)`, ou grafite no ícone de fundo mel. O componente `Logo`
  exporta as células em `CELULAS_COLMEIA`. `CELULA_A` e `CELULA_B` continuam
  exportadas, porque o "Nó de match" da vitrine `/design` usa as duas. Todos
  os ícones foram regerados pela receita da decisão 26 (`resvg-py` + Pillow):
  `app/icon.svg` gera o `favicon.ico` (16/32/48) e o `icone-32.png`, e
  `public/icone-base.svg` gera o apple-touch (180) e os PNGs 192/512 do
  manifest. Nenhum ponto do favo fica a mais de 14,6 do centro num quadro de
  40, ou seja, ele cabe no círculo de 40% da área segura maskable. Por isso o
  mesmo 512 continua servindo para `any` e `maskable`.
- **O que cortamos e por quê.** O texto da regra 5 da decisão 32 ("hexágono só
  no logo, no avatar e no nó de match") continua valendo: o favo é o logo,
  não uma textura de fundo. O script de geração não foi versionado, como na
  decisão 26.
