# Design

Guia visual da rede. Toda tela nova usa estas peças. Para ver tudo funcionando,
rode `make dev-front` e abra **http://localhost:3000/design**.

## Direção

**Rede social limpa, acolhedora e fluida.** O padrão de rede social que todo
mundo já sabe usar (feed no centro, navegação no topo, cartões de post),
executado com o capricho de Threads/Bluesky (espaço, foco no texto) e de
Linear (detalhes finos, movimento suave).

- **Acolhedora:** linguagem leve. O iniciante não pode se sentir avaliado.
- **Limpa:** neutros quentes e uma cor de destaque só (o mel). Espaço sem
  função cortado; listas com divisórias finas.
- **Fluida:** as coisas respondem ao que você faz (tocar, curtir, enviar,
  arrastar) e assentam com suavidade. Nada segue o mouse.

O nome da rede é Colmatch ([decisão 32](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md)).
O texto vem da constante `NOME_REDE` em `frontend/lib/marca.ts` (título da página,
manifest e rótulos acessíveis); a marca desenhada na navegação ("Col" + "match" e o
favo) fica em `frontend/components/ui/Logo.tsx`.

A identidade atual, "Bolsa de saberes" (mel e grafite, painéis densos e réguas
finas), vale sobre a direção acima. O logo está na
[decisão 40](docs/decisoes/40-logo-colmeia.md).

## Cores

Os tokens ficam em `frontend/app/globals.css` e viram classes do Tailwind.
**Nunca use hex ou cores do Tailwind (`zinc`, `teal`...) direto**: use os
tokens, que mudam sozinhos no tema escuro.

| Token | Classe | Uso |
|---|---|---|
| `fundo` | `bg-fundo` | Fundo da página |
| `superficie` | `bg-superficie` | Cartões, campos, menus |
| `superficie-2` | `bg-superficie-2` | Hover, áreas recuadas |
| `linha` / `linha-forte` | `border-linha` | Bordas e divisórias |
| `texto` / `texto-2` / `texto-3` | `text-texto` | Principal, secundário, apagado |
| `marca` / `marca-forte` / `marca-suave` | `bg-marca` | Mel: ações principais, item ativo do menu, tags "sei" |
| `troca` / `troca-suave` | `bg-troca` | Mesmo mel de `marca`: o que fecha um match de troca |
| `estrela` | `text-estrela` | Avaliações |
| `perigo` / `sucesso` | `text-perigo` | Erros e confirmações |

Regras:

- Uma ação primária (`marca`) por tela.
- `troca` usa o mesmo mel de `marca` (decisão 32), então a cor sozinha não
  diz que é uma troca. Use `Botao variante="troca"` (ex.: "Propor troca") e o
  destaque de match só onde a tela trata uma troca. Mel ocupa no máximo 5% da
  tela.
- O tema segue o sistema. A meta é contraste AA (4,5:1 no texto pequeno) nos dois
  temas; confira cada combinação nova, porque nem todas foram medidas.

## Tipografia

Literata (`font-display`, `font-conteudo`) nos títulos e no texto dos posts;
Fira Sans (`font-sans`) na interface; IBM Plex Mono (`font-mono`) só para dados,
com números tabulares. Ver [decisão 32](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md).

| Papel | Classes |
|---|---|
| Título de página | `font-display text-[2rem] font-bold tracking-[-0.025em] leading-tight` |
| Título de seção | `text-lg font-semibold tracking-tight` |
| Texto de post | `font-conteudo text-base leading-relaxed max-w-[65ch]` |
| Secundário | `text-sm text-texto-2` |
| Números | `numeros` (algarismos de mesma largura) e, para tempo, `font-mono` |

Pesos: 400, 500 e 600; títulos de página usam 700. Nada de itálico decorativo.

## Forma e espaço

- Raio: `rounded-cartao` (6px) para cartões e painéis, `rounded-controle`
  (4px) para botões e campos. Tags usam `rounded-[2px]`; avatares são
  hexágonos (`clip-path`), como o nó de match.
- Sombra: nenhuma em cartões (`--sombra` é `none`). `shadow-alta` só em
  popover, menu e toast.
- Cada página escolhe a própria largura. Feed e textos longos podem usar
  `max-w-2xl`.
- Espaço: grupos apertados (`gap-2`/`gap-3`), seções bem separadas (`gap-8`
  ou mais). Mais espaço acima de um título do que abaixo.
- Nunca um cartão dentro de outro.

## Componentes

Todos em `frontend/components/ui/`. Importe com `@/components/ui/<Nome>`.

| Componente | Para quê | Propriedades principais |
|---|---|---|
| `Botao` | Qualquer ação | `variante`: `primario`, `secundario`, `fantasma`, `troca`; `tamanho`: `sm`, `md`; `carregando`; `magnetico` é aceito, mas sem efeito |
| `Campo`, `AreaTexto` | Formulários | `rotulo` (obrigatório), `dica`, `erro` |
| `Cartao` | Post, match, perfil | `interativo` reforça a borda no hover, sem mover; `rotulo` ("01 · Título") numera a seção |
| `Avatar` | Foto ou iniciais | `nome`, `url`, `tamanho`: `sm`, `md`, `lg` |
| `TagHabilidade` | Habilidade | `nome`, `tipo`: `sei`, `quero_aprender` (ou `quero`), `neutra`; `nivel` (1–5); `destaque` (fecha troca) |
| `Estrelas` | Nota | `valor`; com `aoMudar` vira interativa |
| `BotaoCurtir` | Curtida | `curtido`, `total`, `aoAlternar` |
| `Revelar` | Aparecer ao rolar | `atraso` (ms) para escalonar listas |
| `Navegacao` | Barra do topo | já está no layout |
| `Icone` | Ícones | `nome`, `tamanho`, `preenchido` |
| `Folha` | Opções em painel inferior | Alça de arraste; janela centralizada no computador |
| `ToqueDuplo` | Curtir foto com dois toques | Mostra um coração grande |
| `celebrar()` (em `Celebrar.tsx`) | Confete leve | Chamada ao concluir uma ação |
| `PuxarParaAtualizar` | Atualizar lista no celular | Envolve uma lista atualizável |
| `EsqueletoPost`, `EsqueletoLista` | Carregamento | Blocos com pulso de opacidade |
| `SeloContador` | Contador pequeno | Badge numérico |
| `Streak` | Sequência de estudo | Barras da semana e número de dias |
| `NavegacaoLateral` | Navegação no computador | Painel lateral flutuante |
| `CabecalhoCelular` | Navegação no celular | Cabeçalho fino com sequência e avisos |
| `BarraInferior` | Navegação no celular | Cinco destinos fixos |
| `useSelos` | Badges de mensagens, notificações e avaliações | Polling com aba visível |
| `useStreak` | Sequência de estudo | Carrega sequência e último post |

A vitrine `/design` (`frontend/app/design/page.tsx`) mostra os componentes visuais da tabela;
o `EsqueletoPost` aparece dentro da amostra de `EsqueletoLista`. A casca (`Navegacao`,
`NavegacaoLateral`, `CabecalhoCelular`, `BarraInferior`) e os hooks `useSelos` e `useStreak`
não estão na vitrine: eles vivem no layout, montados por `frontend/components/ui/Navegacao.tsx`.

Precisa de um ícone novo? Adicione o caminho SVG em `Icone.tsx`, no mesmo
traço (24×24, linha 1.5, pontas arredondadas). Nada de emoji no lugar de
ícone.

## Movimento

O movimento é o que deixa a rede com cara de produto caprichado. Movimento
responde a ação, nunca à posição do mouse. Ele já está pronto nos componentes:
**usem os componentes e não inventem animações soltas.**

| Efeito | Onde já está | Quando usar |
|---|---|---|
| Página entra com leve subida e desfoque | `app/template.tsx`, automático | Toda navegação |
| Aparecer ao rolar | `Revelar` | Listas do feed, seções do perfil, matches |
| Coração que pulsa | `BotaoCurtir` | Curtidas |
| Partículas da curtida | `BotaoCurtir` | Ao curtir |
| Contador animado | `BotaoCurtir` | Ao mudar o total de curtidas |
| Toque duplo e coração grande | `ToqueDuplo` | Foto de post |
| Folha que sobe | `Folha` | Opções no celular |
| Confete leve | `celebrar()` | Ações concluídas |
| Puxar para atualizar | `PuxarParaAtualizar` | Listas no celular |
| Pulso do esqueleto | `EsqueletoPost`, `EsqueletoLista` | Conteúdo carregando |
| Vibração curta | `vibrar()` em `lib/movimento.ts` | Curtir, seguir e toque duplo; troca ao confirmar |
| Estrelas com escala ao tocar | `Estrelas` interativa | Avaliação pós-troca |

Regras:

- Curva padrão: `ease-saida` (desacelera suave). A curva `ease-mola`, com um
  leve passar do ponto, fica só para elementos pequenos (coração).
- Durações: `--rapido` (160ms) para cor e hover, `--medio` (320ms) para
  posição, `--lento` (640ms) para entradas.
- Um efeito de destaque por tela. Se tudo se mexe, nada chama atenção.
- Tudo respeita `prefers-reduced-motion`: com a opção ligada no sistema, as
  animações somem e o conteúdo aparece direto. Não removam isso.
- Conteúdo nunca depende da animação para existir: se o JavaScript falhar,
  tudo continua visível.

## Navegação e celular

A casca é um painel lateral no computador (a partir de 1024 px) e cabeçalho fino com barra
inferior no celular. Larguras, alturas, variáveis CSS e a régua de alinhamento estão nas
decisões [20](docs/decisoes/20-casca-de-rede-social.md) e
[24](docs/decisoes/24-regua-de-alinhamento.md); os selos de mensagens e notificações, na
[21](docs/decisoes/21-notificacoes-na-leitura.md); a sequência de estudo, na
[23](docs/decisoes/23-streak-no-fuso-do-brasil.md). Os valores valem como estão no código
(`frontend/components/ui/casca.ts` e `globals.css`); este guia não os repete.

## Telas

Antes de criar uma tela, copie a estrutura da tela parecida que já existe: feed em
`frontend/app/feed/page.tsx`, matches em `frontend/app/matches/page.tsx`, perfil em
`frontend/app/perfil/[username]/page.tsx` e conversa em `frontend/app/mensagens/[username]/page.tsx`.
Toda lista tem estado vazio com uma frase e uma ação, um estado de carregamento e um erro que
diz o que fazer.

## Não fazer

- Cores fora dos tokens, gradiente em texto, sombras coloridas.
- Borda grossa colorida na lateral de cartões.
- Rótulo pequeno em maiúsculas acima de títulos.
- Emoji como ícone.
- Animação nova fora dos componentes sem combinar com o time.
- Efeito que segue o mouse (holofote, botão magnético, pílula que persegue o ponteiro).
- Cartão dentro de cartão.
