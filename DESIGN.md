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
Ele vem da constante `NOME_REDE` em `frontend/lib/marca.ts`: trocá-la muda o
nome na navegação, no título e no manifest.

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

A vitrine `/design` (`frontend/app/design/page.tsx`) mostra os componentes visuais da tabela. A
casca (`Navegacao`, `NavegacaoLateral`, `CabecalhoCelular`, `BarraInferior`), o `EsqueletoPost` e os
hooks `useSelos` e `useStreak` não aparecem nela: veja o uso real em
`frontend/components/ui/Navegacao.tsx`, que monta a casca com os dois hooks, e em
`frontend/components/ui/Esqueleto.tsx`.

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

No computador (a partir de 1024 px), a casca usa um painel lateral flutuante à
esquerda, com logo, sequência, Feed, Buscar, Matches, Mensagens, Notificações,
Perfil, Publicar, tema e Sair. Entre 1024 e 1279 px, mostra só ícones; a partir
de 1280 px, ícones e rótulos. O item ativo ganha fundo `superficie-2`, texto em
negrito e uma barra mel de 2 px na borda do painel. A área central tem pelo menos 960 px a partir de 1280 px.

No celular (abaixo de 1024 px), há um cabeçalho fino com logo, sequência,
notificações, mensagens e "Mais opções". Esse botão abre uma `Folha` com tema
e sair. A barra inferior fixa e plana tem Feed, Buscar, Publicar (+), Matches
e Perfil, e respeita a área segura do iPhone. Publicar e + levam a
`/feed?publicar=1`.

As variáveis da casca são `--altura-navegacao` (3,5 rem no celular, 0 no
computador logado), `--altura-barra-inferior` (4 rem mais área segura no
celular, 0 no computador) e `--largura-lateral`. Valem quando `<html
data-logado="sim">`; um script no `<head>` define esse atributo antes da
pintura. Exemplo: `h-[calc(100dvh-var(--altura-navegacao)-var(--altura-barra-inferior))]`.

Mensagens usam `GET /dms/nao-lidas` (C1) e notificações usam
`GET /notificacoes/nao-lidas` (C2). Os badges consultam a cada 15 s com a aba
visível e ao trocar de rota. Erro remove o badge; 404 também interrompe as consultas
àquele endpoint até recarregar.

A sequência fica sempre visível, com barras da semana e número na lateral e no
cabeçalho do celular. Vem de `GET /usuarios/{eu}` (`streak`) e do último post,
contado no fuso de São Paulo, como em
[decisão 23](docs/decisoes/23-streak-no-fuso-do-brasil.md). As barras acendem em mel
nos dias seguidos; o número fica em `texto` quando a pessoa já postou hoje e em
`texto-2` quando falta. A dica é "Poste hoje para manter sua sequência de N
dias". Clicar leva para Publicar, ou para o próprio perfil se já postou hoje.

O app é instalável como PWA, com `display: standalone`, ícones 192, 512,
maskable e `apple-touch-icon`, `viewport-fit=cover` e `theme-color` claro ou
escuro. Campos têm 16 px no celular para evitar zoom no iOS e altura de 44 px.
`Botao tamanho="sm"` também mantém alvo de toque de 44 px no celular.

## Telas: padrão sugerido

- **Feed:** coluna `max-w-2xl`, formulário de novo post no topo, use
  `EsqueletoLista` ao carregar, `PuxarParaAtualizar` na lista e `ToqueDuplo`
  na foto. Posts dentro de `Revelar`, com `atraso` de 40 ms por
  item até o sexto (`frontend/app/feed/page.tsx`).
- **Matches:** duas tabelas (`TabelaPares` em `frontend/app/matches/page.tsx`):
  "01 · Pares de troca" primeiro, com as colunas Pessoa, Te ensina e Você
  ensina, e depois "02 · Pode te ensinar". Cada linha termina num link
  "Conversar" (`BotaoLink tamanho="sm"`), com `variante="troca"` nos pares de
  troca e `variante="secundario"` em "Pode te ensinar".
- **Perfil:** cabeçalho com `Avatar tamanho="lg"`, contadores com `numeros`,
  nota com `Estrelas`, habilidades em `TagHabilidade`. Edição de habilidades
  em `EditorHabilidades` (`frontend/components/perfil/`).
- **Mensagens:** lista de conversas à esquerda no desktop e tela cheia no
  celular. Balões em `bg-marca-suave` (meus) e `bg-superficie-2` (dele).
- **Estados:** toda lista tem estado vazio com uma frase e uma ação ("Você
  ainda não segue ninguém. Veja seus matches"), carregando com
  `Botao carregando` ou um texto curto, e erro dizendo o que fazer.

## Não fazer

- Cores fora dos tokens, gradiente em texto, sombras coloridas.
- Borda grossa colorida na lateral de cartões.
- Rótulo pequeno em maiúsculas acima de títulos.
- Emoji como ícone.
- Animação nova fora dos componentes sem combinar com o time.
- Efeito que segue o mouse (holofote, botão magnético, pílula que persegue o ponteiro).
- Cartão dentro de cartão.
