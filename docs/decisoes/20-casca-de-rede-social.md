# 20. Casca de rede social: painel lateral no computador, barra inferior no celular, movimento por ação

- **Contexto:** no teste de 22/11 vieram três relatos: "não gostei desse
  verde seguindo o mouse", o computador com as laterais vazias e o app no
  celular parecendo um site de desktop encolhido (sem barra inferior, sem
  instalar na tela inicial, zoom ao focar campos). O celular é onde a rede
  mais vai ser usada, entre aulas e à noite.
- **Opções:** lateral limpa estilo Threads, pílula teal que acompanha a
  navegação ou painel flutuante; barra inferior flutuante, plana com ícones ou
  com rótulos; hover que muda o fundo, só borda ou borda e sombra.
- **Escolha:** painel lateral flutuante à esquerda no computador e barra
  inferior plana com cinco ícones no celular. O item ativo tem indicador fixo.
  Cartões interativos ganham borda e sombra mais fortes no hover, sem se
  mover. Movimento responde à ação (tocar, curtir, enviar, arrastar), nunca à
  posição do mouse. A prop `magnetico` continua aceita em `Botao`, mas não tem
  efeito, para preservar o contrato C8 de não remover props.
- **O que cortamos e por quê:** holofote verde nos cartões, pílula que seguia o
  ponteiro e efeito do botão magnético; seguir o mouse desviava o foco da ação.
  Web Push com o app fechado ficou fora do escopo (P2). Esconder a barra ao
  rolar atrapalharia quem ainda aprende onde ficam os destinos. As integrações
  em páginas de outras issues ficam com seus arquivos donos, como toque duplo
  em `CartaoPost`, puxar para atualizar no feed, `celebrar()` ao confirmar
  troca e as variáveis de altura no chat.
- **Como foi feito / Como ficou:**
  - No computador, a partir de 1024 px, a lateral mostra logo, sequência,
    Feed, Buscar, Matches, Mensagens, Notificações, Perfil, Publicar, tema e
    Sair. Entre 1024 e 1279 px mostra só ícones; a partir de 1280 px mostra
    ícones e rótulos. A área central tem ao menos 960 px a partir de 1280 px
    (C6), e cada página escolhe sua largura.
  - No celular, abaixo de 1024 px, o cabeçalho fino traz logo, sequência,
    notificações, mensagens e "Mais opções". A folha oferece tema e sair. A
    barra inferior fixa e plana traz Feed, Buscar, +, Matches e Perfil, com
    área segura do iPhone. Publicar e + abrem `/feed?publicar=1`.
  - `--altura-navegacao` vale 3,5 rem no celular e 0 no computador logado;
    `--altura-barra-inferior` vale 4 rem mais área segura no celular e 0 no
    computador; `--largura-lateral` define a lateral. Com
    `<html data-logado="sim">`, script no `<head>` define o estado antes da
    pintura.
  - Badges consultam `GET /dms/nao-lidas` (C1) e
    `GET /notificacoes/nao-lidas` (C2) a cada 15 s com aba visível e ao trocar
    de rota. Erro ou 404 remove o badge e para as consultas àquele endpoint
    até recarregar.
  - A sequência vem de `GET /usuarios/{eu}` (`streak`) e da data UTC do
    último post. A chama fica laranja quando já postou hoje e cinza quando
    falta; número na cor do texto para contraste AA. A dica diz "Poste hoje
    para manter sua sequência de N dias" e clicar abre Publicar. `troca` é
    usado também na chama por sua cor natural.
  - Entraram `Folha`, `ToqueDuplo`, `Celebrar`/`celebrar()`,
    `PuxarParaAtualizar`, `Esqueleto`/`EsqueletoPost`/`EsqueletoLista`,
    `SeloContador`, `Streak`, `NavegacaoLateral`, `CabecalhoCelular`,
    `BarraInferior`, `useNaoLidas`, `useStreak` e `casca.ts`. `BotaoCurtir`
    ganhou partículas e contador animado; `vibrar()` em `lib/movimento.ts`
    vibra 10 ms ao curtir, seguir e usar toque duplo. As outras issues chamam
    a vibração ao confirmar troca.
  - A base mobile inclui PWA instalável, ícones 192/512/maskable e
    `apple-touch-icon`, `display: standalone`, `theme_color` teal,
    `viewport-fit=cover`, `theme-color` claro/escuro, campos de 16 px e alvos
    de 44 px no celular. `Botao tamanho="sm"` também tem alvo de 44 px.
  - As escolhas de painel, barra, hover e chama foram feitas pelo dono da
    issue entre opções apresentadas lado a lado. A pesquisa considerou barra
    com 3 a 5 destinos e alvos de 44 pt (HIG/WCAG) a 48 dp (Material), além
    do padrão de lateral que vira trilho de ícones em telas médias.
