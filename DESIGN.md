# Design

Guia visual da rede. Toda tela nova usa estas peças. Para ver tudo funcionando,
rode `make dev-front` e abra **http://localhost:3000/design**.

## Direção

**Rede social limpa, acolhedora e fluida.** O padrão de rede social que todo
mundo já sabe usar (feed no centro, navegação no topo, cartões de post),
executado com o capricho de Threads/Bluesky (espaço, foco no texto) e de
Linear (detalhes finos, movimento suave).

- **Acolhedora:** cantos arredondados, verde-azulado calmo, linguagem leve. O
  iniciante não pode se sentir avaliado.
- **Limpa:** neutros com um toque de verde-azulado e uma cor de destaque só.
  Muito espaço, pouca borda.
- **Fluida:** as coisas respondem ao que você faz (tocar, curtir, enviar,
  arrastar) e assentam com suavidade. Nada segue o mouse.

O nome "Troca" na navegação é provisório: troque a constante `NOME_REDE` em
`frontend/lib/marca.ts` quando o time escolher o nome.

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
| `marca` / `marca-forte` / `marca-suave` | `bg-marca` | Verde-azulado: ações principais, link ativo, "sei" |
| `troca` / `troca-suave` | `bg-troca` | Laranja: o que fecha um match de troca e a chama da sequência |
| `estrela` | `text-estrela` | Avaliações |
| `perigo` / `sucesso` | `text-perigo` | Erros e confirmações |

Regras:

- Uma ação primária (`marca`) por tela.
- O laranja (`troca`) é raro de propósito: aparece no "Match de troca", no
  botão "Propor troca", na habilidade que fecha a troca e na chama da
  sequência, por ser a cor natural do fogo. Se aparecer em todo lugar, perde
  o significado.
- O tema segue o sistema. Os dois temas têm contraste AA.

## Tipografia

Geist para tudo e Geist Mono só para tempo de estudo, números e código.

| Papel | Classes |
|---|---|
| Título de página | `text-[2rem] font-semibold tracking-[-0.025em] leading-tight` |
| Título de seção | `text-lg font-semibold tracking-tight` |
| Texto de post | `text-[0.9375rem] leading-relaxed max-w-[65ch]` |
| Secundário | `text-sm text-texto-2` |
| Números | `numeros` (algarismos de mesma largura) e, para tempo, `font-mono` |

Pesos: 400, 500 e 600. Nada de negrito 700+ nem itálico decorativo.

## Forma e espaço

- Raio: `rounded-cartao` (14px) para cartões e quadros, `rounded-controle`
  (10px) para botões e campos, `rounded-full` para tags e avatares.
- Sombra: `shadow-cartao` em repouso, `shadow-alta` em destaque ou hover.
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
| `Cartao` | Post, match, perfil | `interativo` reforça borda e sombra no hover, sem mover |
| `Avatar` | Foto ou iniciais | `nome`, `url`, `tamanho`: `sm`, `md`, `lg`; `online` |
| `TagHabilidade` | Habilidade | `nome`, `tipo`: `sei`, `quero_aprender`, `neutra`; `nivel` (1–5); `destaque` (fecha troca) |
| `Estrelas` | Nota | `valor`; com `aoMudar` vira interativa |
| `BotaoCurtir` | Curtida | `curtido`, `total`, `aoAlternar` |
| `QuadroArrastavel` | Mover itens entre colunas | `colunas`, `aoMover`, `renderItem` |
| `Revelar` | Aparecer ao rolar | `atraso` (ms) para escalonar listas |
| `Navegacao` | Barra do topo | já está no layout |
| `Icone` | Ícones | `nome`, `tamanho`, `preenchido` |
| `Folha` | Opções em painel inferior | Alça de arraste; janela centralizada no computador |
| `ToqueDuplo` | Curtir foto com dois toques | Mostra um coração grande |
| `Celebrar` | Confete leve | `celebrar()` ao concluir uma ação |
| `PuxarParaAtualizar` | Atualizar lista no celular | Envolve uma lista atualizável |
| `Esqueleto`, `EsqueletoPost`, `EsqueletoLista` | Carregamento | Esqueleto com brilho |
| `SeloContador` | Contador pequeno | Badge numérico |
| `Streak` | Sequência de estudo | Chama e número de dias |
| `NavegacaoLateral` | Navegação no computador | Painel lateral flutuante |
| `CabecalhoCelular` | Navegação no celular | Cabeçalho fino com sequência e avisos |
| `BarraInferior` | Navegação no celular | Cinco destinos fixos |
| `useNaoLidas` | Badges de mensagens e notificações | Polling com aba visível |
| `useStreak` | Sequência de estudo | Carrega sequência e último post |

Exemplos de uso de cada um estão em `frontend/app/design/page.tsx`.

Precisa de um ícone novo? Adicione o caminho SVG em `Icone.tsx`, no mesmo
traço (24×24, linha 1.7, pontas arredondadas). Nada de emoji no lugar de
ícone.

## Movimento

O movimento é o que deixa a rede com cara de produto caprichado. Movimento
responde a ação, nunca à posição do mouse. Ele já está pronto nos componentes:
**usem os componentes e não inventem animações soltas.**

| Efeito | Onde já está | Quando usar |
|---|---|---|
| Página entra com leve subida e desfoque | `app/template.tsx`, automático | Toda navegação |
| Arrastar com inclinação e assentamento com mola | `QuadroArrastavel` | Editor de habilidades (Sei / Quero aprender) |
| Aparecer ao rolar | `Revelar` | Listas do feed, seções do perfil, matches |
| Coração que pulsa | `BotaoCurtir` | Curtidas |
| Partículas da curtida | `BotaoCurtir` | Ao curtir |
| Contador animado | `BotaoCurtir` | Ao mudar o total de curtidas |
| Toque duplo e coração grande | `ToqueDuplo` | Foto de post |
| Folha que sobe | `Folha` | Opções no celular |
| Confete leve | `Celebrar` / `celebrar()` | Ações concluídas |
| Puxar para atualizar | `PuxarParaAtualizar` | Listas no celular |
| Brilho do esqueleto | `Esqueleto`, `EsqueletoPost`, `EsqueletoLista` | Conteúdo carregando |
| Vibração curta | `vibrar()` em `lib/movimento.ts` | Curtir, seguir e toque duplo; troca ao confirmar |
| Estrelas que acendem em sequência | `Estrelas` interativa | Avaliação pós-troca |

Regras:

- Curva padrão: `ease-saida` (desacelera suave). A curva `ease-mola`, com um
  leve passar do ponto, fica só para elementos pequenos (coração e estrelas).
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
de 1280 px, ícones e rótulos. O item ativo fica verde-azulado, com marcador na
borda do painel. A área central tem pelo menos 960 px a partir de 1280 px.

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
visível e ao trocar de rota. Erro ou 404 remove o badge e interrompe consultas
àquele endpoint até recarregar.

A sequência fica sempre visível, com chama e número na lateral e no cabeçalho
do celular. Vem de `GET /usuarios/{eu}` (`streak`) e do último post, contado
em UTC como no backend. A chama fica laranja quando a pessoa já postou hoje e
cinza quando falta; o número usa a cor do texto para manter contraste AA. A
dica é "Poste hoje para manter sua sequência de N dias". Clicar leva para
Publicar.

O app é instalável como PWA, com `display: standalone`, ícones 192, 512,
maskable e `apple-touch-icon`, `viewport-fit=cover` e `theme-color` claro ou
escuro. Campos têm 16 px no celular para evitar zoom no iOS e altura de 44 px.
`Botao tamanho="sm"` também mantém alvo de toque de 44 px no celular.

## Telas: padrão sugerido

- **Feed:** coluna `max-w-2xl`, formulário de novo post no topo, use
  `EsqueletoLista` ao carregar, `PuxarParaAtualizar` na lista e `ToqueDuplo`
  na foto. Posts em `Cartao interativo` dentro de `Revelar` com
  `atraso={i * 60}` (máximo 6 itens escalonados).
- **Matches:** seção "Match de troca" primeiro, em destaque com o laranja;
  depois "Pode te ensinar". Cada pessoa num `Cartao interativo` com
  `Botao variante="troca"` para conversar.
- **Perfil:** cabeçalho com `Avatar tamanho="lg"`, contadores com `numeros`,
  nota com `Estrelas`, habilidades em `TagHabilidade`. Edição de habilidades
  com `QuadroArrastavel`.
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
