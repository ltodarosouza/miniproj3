# 44. Recorte da foto do post e texto longo sem espaço

Pedido direto do dono, sem issue.

- **Contexto.** Ao anexar uma foto ao post não dava para escolher o
  enquadramento, como nas outras redes. E uma mensagem do direct com uma
  sequência sem espaços ("AAAAAAAA…") vazava do balão e ficava cortada: o
  `break-words` (`overflow-wrap: break-word`) quebra a palavra só depois que a
  largura está decidida, mas não reduz a largura mínima do balão, que crescia
  até o tamanho da palavra inteira. Texto de post e de comentário tinham o
  mesmo problema.
- **Opções (recorte).** (a) biblioteca pronta de recorte; (b) editor próprio
  com `<dialog>` nativo e canvas; (c) recorte feito no backend.
- **Escolha (recorte).** (b), em `components/posts/RecortarFoto.tsx`. A
  moldura fica parada e a foto anda por baixo: arrastar posiciona; o controle
  de zoom, a roda do mouse e a pinça aproximam (até 4×); setas e +/− fazem o
  mesmo pelo teclado. Proporções: Original, Quadrada (1:1), Retrato (4:5) e
  Paisagem (16:9). A regra dos terços aparece enquanto arrasta. O editor abre
  logo depois de escolher a foto, em "Novo post" e ao trocar a foto na edição;
  "Cancelar" (ou Esc) mantém a foto anterior. O botão "Recortar" na prévia
  reabre o editor a partir da foto original, com o último enquadramento. O
  recorte sai de `recortarImagem` em `lib/imagens.ts`, que reaproveita a
  mesma exportação de `prepararImagem` (webp ou jpeg, até 1600 px e 2 MB),
  então o backend não muda. A prévia passou a `object-contain` para mostrar
  exatamente o recorte escolhido. Usa o mesmo cartão e fundo da lupa
  (decisão 43) e trava a rolagem com `lib/rolagem.ts`.
- **Escolha (texto).** `[overflow-wrap:anywhere]`, já usado em matches, busca
  e trocas, no balão do direct (com `min-w-0`), no texto do post e no
  comentário: a sequência quebra na largura do balão e dá para ler tudo.
- **O que cortamos e por quê.** Rotação, filtros e ajuste de brilho: o pedido
  era recortar, e cada um pede controles novos. Recortar de novo a foto que já
  está no servidor: o canvas não exporta imagem de outra origem sem CORS, então
  na edição o recorte vale para uma foto nova. O feed continua com
  `max-h-[28rem]` e `object-cover`: uma foto em Retrato numa coluna larga
  ainda pode perder um pouco em cima e embaixo no cartão (a lupa mostra
  inteira).