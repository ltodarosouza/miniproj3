# 32. Identidade Colmatch e sistema visual "Bolsa de saberes"

- **Contexto:** issue #78. O visual verde-azulado e a primeira proposta em mel
  tinham cara de IA: favo como textura, avatares pastel, pílulas amarelas,
  cartões iguais com sombra difusa, widget decorativo, cabeçalhos centralizados
  e marketing genérico. A direção passa a ser corporativa e técnica, com
  réguas, tabelas de mercado e tipografia editorial em preto e amarelo.
- **Opções:** manter o verde e só renomear; usar mel decorativo com favo, como
  na primeira proposta; ou adotar "Bolsa de saberes", com painéis densos,
  réguas, tabela de mercado e tipografia editorial preta e amarela.
- **Escolha:** o nome do produto é Colmatch (`lib/marca.ts`). A metáfora guia
  as telas: pares, ordens, cotação, diário e ticker.

  1. Mel é sinal de ação ou conexão e ocupa no máximo 5% da tela.
  2. Réguas de 1 px, raio de 4 px nos controles e 6 px nos painéis. Sem sombra,
     exceto em popover, menu e toast.
  3. Literata (com eixo óptico) nos títulos e no texto de posts, comentários e
     bio (`font-display` e `font-conteudo`); Fira Sans na interface
     (`font-sans`); IBM Plex Mono só nos dados, sempre com números tabulares.
  4. Seções usam rótulo numerado, como `01 · Pares de troca`: o número em mono
     e o nome em Fira Sans 13 px semibold, sem caixa alta nem espaçamento.
  5. Hexágono só no logo, na máscara do avatar e no nó de match.
  6. Densidade profissional: listas com divisórias, colunas alinhadas e menos
     espaço sem função.

  Não pode: padrão de favo de fundo; avatar com cor pastel aleatória; pílula em
  toda etiqueta; sombra grande e difusa; gradiente; emoji como ícone; ícone
  decorativo ao lado de todo título; tudo centralizado; texto de marketing vago.

  **Logo:** três células: duas preenchidas e ligadas representam o match; a
  vazia representa a próxima conexão. O nome é "Col" em grafite e "match" em
  mel: `#A86A00` no claro e `#F2A900` no escuro. O ícone do app usa
  fundo mel e símbolo grafite; o favicon usa fundo grafite e só as células.

  **Tokens:** os nomes antigos são mantidos para que todas as telas mudem sem
  edição individual.

  | Token | Claro | Escuro |
  |---|---|---|
  | `--fundo` | `#F7F6F2` | `#121110` |
  | `--superficie` | `#FFFFFF` | `#1B1A17` |
  | `--superficie-2` | `#EFEDE7` | `#24221E` |
  | `--linha` | `#E2DFD6` | `#2E2B26` |
  | `--linha-forte` | `#CFCBBF` | `#3D3A33` |
  | `--texto` | `#1B1A17` | `#F3F1EA` |
  | `--texto-2` | `#57534A` | `#B5B0A4` |
  | `--texto-3` | `#8A857A` | `#858073` |
  | `--marca` | `#F2A900` | `#F2A900` |
  | `--marca-forte` | `#A86A00` | `#F5B82E` |
  | `--marca-suave` | `#FBF0D2` | `#2E2614` |
  | `--marca-texto` | `#1B1A17` | `#1B1A17` |
  | `--troca` / `--troca-suave` | `--marca` / `--marca-suave` | idem |
  | `--sucesso` | `#2F7D4F` | `#5DBB84` |
  | `--perigo` | `#B42318` | `#F06A5E` |
  | `--selo` / `--selo-texto` | `#F2A900` / `#1B1A17` | idem |
  | `--estrela` | `#F2A900` | `#F2A900` |
  | `--grafite` / `--grafite-texto` | `#1B1A17` / `#F3F1EA` | `#F3F1EA` / `#1B1A17` |
  | `--alta` / `--baixa` | `#2F7D4F` / `#B42318` | `#5DBB84` / `#F06A5E` |
  | `--raio` / `--raio-sm` | `6px` / `4px` | idem |
  | `--sombra` | `none` | `none` |
  | `--sombra-alta` | curta, só popover/menu/toast | idem |

  **Componentes de base:** mantêm as mesmas props: Botao, Cartao com `rotulo`,
  Campo, Avatar hexagonal com iniciais mono, TagHabilidade mono com variante
  `quero` além de `quero_aprender`, SeloContador, Esqueleto sem gradiente,
  Folha, Estrelas, BotaoTema e Icone com traço de 1,5 px e `par`, `ordem`,
  `alta` e `baixa`. O Logo é novo. A vitrine `/design` funciona como guia vivo.

  Os ícones são regerados pela receita da decisão 26: `icon.svg` gera
  `favicon.ico` em 16/32/48 px e `icone-32.png`; `icone-base.svg` gera os
  tamanhos 192/512 e apple-touch, com o símbolo a 75% para caber na área
  segura do `maskable`.
- **O que cortamos e por quê:** navegação, feed, perfil, pares, mensagens,
  notificações e trocas ficam para as issues #79 a #86, que só importam estes
  componentes. O ticker da vitrine é estático, sem animação nova no CSS.
  Na limpeza da auditoria F17/F18, `QuadroArrastavel` e o ícone `arrastar` são
  apagados; `animarMola`, `MOLA_SUAVE`, `Mola` e `useMagnetico` são removidos.
  A prop `magnetico` fica sem efeito desde a decisão 20. A prop `online` de
  Avatar sai porque não tem chamador nem presença no backend.
- **Revisão da tipografia:** Space Grotesk, Plex Sans no corpo e rótulos em mono
  maiúscula ainda davam cara de template gerado por IA. O grupo comparou Libre
  Franklin, Fira Sans e Literata direto no app e escolheu a versão híbrida:
  serifa onde está o diário (títulos e texto dos posts) e sem serifa na
  interface, que fica leve em tamanhos pequenos e no celular. Separadores de
  data e o número da ordem continuam em mono, porque são dados. Mensagens do
  chat ficam em Fira Sans: são conversa, não diário. Os rótulos usam
  `texto-2`, porque 13 px em `texto-3` fica abaixo do contraste mínimo.
