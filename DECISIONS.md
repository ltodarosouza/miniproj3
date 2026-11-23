# Decisões do time

**Time:** @italoosilva (Pessoa A), @NicoleAlverga (Pessoa B), @gecbeltrao (Pessoa C) e @ltodarosouza (Pessoa D)

**Rede:** troca de habilidades entre iniciantes em tech. Nome da rede: _a decidir_.

Este arquivo acompanha o projeto. Atualizem quando as decisões mudarem. O
escopo detalhado de cada frente está em [docs/FRENTES.md](docs/FRENTES.md).

## Produto

- **Público:** iniciantes em tech: universitários, alunos de bootcamp e quem
  está migrando de área, aprendendo programação e as disciplinas da base
  (Cálculo 1, Estrutura de Dados).
- **Problema:** quem aprende sozinho trava e não tem a quem perguntar. O
  professor não explica bem, o tutorial não cobre a dúvida e aula particular
  é cara. Ao mesmo tempo, essa mesma pessoa já sabe outra coisa que alguém
  precisa aprender.
- **Como a rede resolve:** cada pessoa diz o que sabe e o que quer aprender.
  A rede mostra quem pode te ensinar e, em destaque, com quem dá para trocar
  ("te ensino React, você me ensina Cálculo 1"). Depois do match, as duas
  pessoas conversam, agendam a troca e se avaliam.
- **Como saberíamos que funcionou:** uma troca agendada termina com avaliação
  dos dois lados, e a pessoa volta para marcar outra.

## Decisões de produto

### 1. Match em dois níveis

- **Contexto:** o match de troca exige que eu queira o que você sabe e que
  você queira o que eu sei. Numa rede pequena isso quase nunca acontece, e a
  pessoa entra e não encontra ninguém.
- **Opções:** só troca recíproca; lista de todo mundo ordenada por
  compatibilidade; dois níveis.
- **Escolha:** dois níveis. "Pode te ensinar" mostra quem sabe o que eu quero
  aprender. "Match de troca" mostra quem também quer algo que eu sei, e
  aparece em destaque.
- **O que cortamos e por quê:** a troca recíproca pura. Ela é o ideal, mas
  deixaria a maioria das pessoas sem nenhum resultado.
- **Como ficou:** `GET /matches` devolve `troca` e `pode_te_ensinar`. Quem
  está na troca não se repete na outra lista. Dentro de cada grupo, vem
  primeiro quem tem mais habilidades em comum comigo (o que a pessoa me ensina
  mais o que eu ensino a ela), com empate pelo nome sem acento. O
  índice invertido de `core/matches.py` escolhe os candidatos, e o banco só
  completa nome e nível deles.

### 2. Agendamento interno, sem login com Google

- **Contexto:** a troca acontece numa chamada. A rede precisa saber quando
  ela aconteceu para pedir a avaliação.
- **Opções:** integração completa com o Google Agenda (login com Google,
  leitura dos horários livres e convite enviado por e-mail); agendamento
  interno com um link para o Google Agenda.
- **Escolha:** agendamento interno. No chat, um propõe data, hora e link do
  Meet, e o outro confirma. Cada um tem o botão "Adicionar ao Google Agenda".
  Passado o horário, a rede pede a avaliação aos dois.
- **O que cortamos e por quê:** o OAuth do Google. Exige tela de
  consentimento e cadastro de usuários de teste no Google Cloud, e poderia
  travar o time por dias. O link entrega o mesmo resultado prático.

### 3. A IA só traduz para o catálogo, não cria habilidade

- **Contexto:** o match depende de "Python" e "pyton" serem a mesma coisa.
- **Opções:** texto livre; catálogo fechado; IA que mapeia para o catálogo e
  cria itens novos; IA que só mapeia para itens existentes.
- **Escolha:** catálogo com autocomplete. Se a pessoa digitar livre, a IA
  aponta o item do catálogo que corresponde. Sem correspondência, pedimos
  para escolher da lista. Se a API falhar, usamos uma busca aproximada.
- **O que cortamos e por quê:** a IA criar habilidades. O catálogo ficaria
  bagunçado e o match deixaria de ser confiável.

### 4. Nível é informativo, não decide quem ensina

- **Contexto:** a pessoa marca o nível (1 a 5) em cada habilidade.
- **Opções:** exigir nível mínimo para ensinar; nível só informativo.
- **Escolha:** informativo. Quem se dispõe a ensinar pode ensinar. O nível
  ajuda o iniciante a escolher alguém próximo do seu nível, que muitas vezes
  explica melhor do que alguém muito avançado.
- **O que cortamos e por quê:** o bloqueio por nível. Ele reduziria ainda
  mais os matches numa rede pequena.

### 5. Feed com quem eu sigo e quem pode me ensinar

- **Contexto:** o feed precisa ajudar a pessoa a descobrir com quem aprender.
- **Opções:** só posts de quem eu sigo; seguidos mais posts de quem sabe o que
  eu quero aprender.
- **Escolha:** feed misto, em ordem cronológica. Cada post de alguém que eu
  não sigo vem marcado como "pode te ensinar".
- **O que cortamos e por quê:** o feed ranqueado por engajamento. Para quem
  quer aprender, importa ver quem estuda aquilo agora, não o post mais curtido.

### 6. Visual de rede social conhecida, com movimento caprichado

- **Contexto:** quatro pessoas constroem telas em paralelo, e o público é
  iniciante e precisa se sentir em casa.
- **Opções:** um visual temático (álbum de figurinhas, tabela periódica,
  quadro branco) ou o padrão de rede social executado com capricho.
- **Escolha:** o padrão de rede social, limpo e acolhedor, em verde-azulado,
  com tema claro e escuro e movimento fluido (holofote que segue o mouse,
  arrastar habilidades, transições suaves). Detalhes no [DESIGN.md](DESIGN.md).
- **O que cortamos e por quê:** os visuais temáticos. Seriam mais marcantes,
  mas mais difíceis de reproduzir igual em quatro frentes e mais arriscados
  de parecer infantis. A personalidade fica no movimento e nos detalhes.

### 7. Chat por polling, com o id da última mensagem como cursor

- **Contexto:** a conversa precisa mostrar as mensagens novas sem a pessoa
  recarregar a página. WebSocket está fora do escopo.
- **Opções:** recarregar a conversa inteira a cada poucos segundos; buscar só
  o que chegou depois de uma data; buscar só o que chegou depois do id da
  última mensagem.
- **Escolha:** a tela pergunta a cada 3 segundos
  `GET /dms/{username}?depois_de=<id>` e recebe só as novas. O polling pausa
  com a aba escondida. O id é crescente e único, então não perde nem repete
  mensagens enviadas no mesmo segundo, o que a data não garante.
- **O que cortamos e por quê:** WebSocket e "digitando...". Exigiriam um
  servidor com conexão aberta e complicariam o deploy; 3 segundos de atraso
  bastam para combinar uma troca.

### 8. Troca proposta no chat, avaliada só depois do horário

- **Contexto:** a rede só pode pedir avaliação de uma troca que aconteceu, e
  nem toda troca é recíproca ("pode te ensinar").
- **Opções:** avaliar a pessoa a qualquer momento; avaliar a troca depois do
  horário marcado.
- **Escolha:** a troca guarda o que quem propôs ensina e o que aprende, e
  basta uma das duas. Ela nasce `proposta`, só quem recebeu confirma ou recusa,
  e a avaliação abre para os dois quando o horário de uma troca confirmada
  passa. Cada pessoa avalia uma vez por troca. O pedido aparece num cartão
  flutuante em qualquer tela, que pode ser adiado.
- **O que cortamos e por quê:** avaliação livre de perfil. Viraria ranking de
  popularidade, e a nota precisa vir de uma troca real (princípio "prova, não
  promessa").

### 9. Follow idempotente, com o estado devolvido na resposta

- **Contexto:** o botão de seguir aparece no perfil, nas listas e nos
  matches, e precisa mostrar o estado certo sem recarregar a página.
- **Opções:** `POST`/`DELETE` devolvendo `204`, com a tela fazendo um `GET`
  depois para saber o contador; ou devolver o estado atualizado na resposta.
- **Escolha:** `POST` e `DELETE /usuarios/{username}/follow` são idempotentes
  (seguir duas vezes não duplica, e a tabela `follows` tem `UNIQUE` no par) e
  devolvem `{"seguindo", "seguidores"}`. Assim a tela economiza uma ida ao
  servidor e o contador nunca fica velho. `GET` na mesma rota diz se quem está
  logado segue a pessoa, e as listas de seguidores/seguindo trazem `eu_sigo`
  em cada item, para não fazer um pedido por pessoa.
  `services.follows.contadores(db, id)` entrega `seguidores` e `seguindo` para
  o perfil de A.
- **O que cortamos e por quê:** seguir de volta automático. O follow imediato
  é o comportamento de conta pública do [CONTRATO.md](CONTRATO.md); conta
  privada com pedidos (`202`) fica como extra, se der tempo.
- **Encaixe com o login:** as listas usam `get_current_user_opcional` em
  `deps.py`, para quem não está logado ver as listas. Quando A trocar o
  `X-User-Id` pelo token, troca nas duas funções.

### 10. Login com token opaco em sessões

- **Contexto:** toda rota protegida precisa saber quem está chamando. O
  `X-User-Id` da Fase 0 só funciona com `DEBUG=true` e qualquer pessoa poderia
  mandá-lo para se passar por outra; não é autenticação.
- **Opções:** JWT assinado e stateless; token opaco guardado numa tabela
  `sessions`; cookie `httpOnly` com sessão no servidor.
- **Escolha:** token opaco. O cadastro guarda só o hash bcrypt da senha em
  `users.password_hash`. O login confere o hash e cria uma linha em `sessions`
  com um token aleatório de 32 bytes (`secrets.token_urlsafe`), devolvido uma
  única vez. Toda request protegida manda `Authorization: Bearer <token>`; o
  `get_current_user` busca a sessão pelo token e devolve o dono. Logout apaga a
  linha e o token morre de verdade. Cada login cria uma sessão nova, e várias
  sessões podem coexistir (celular e notebook). Sem expiração: o logout revoga
  a sessão, e expiração fica como extra se o produto crescer. O front chama
  `GET /auth/eu` depois do login para validar o token e guardar o id.
- **O que cortamos e por quê:** JWT, porque revogar exige lista negra e o ganho
  de não consultar o banco não compensa neste tamanho; cookie `httpOnly`,
  porque exigiria CORS com credenciais e proteção de CSRF; refresh token e
  expiração, porque adicionam código e teste sem mudar a demo. O token fica no
  `localStorage`: um XSS pode lê-lo, mas cookie `httpOnly` exigiria CORS com
  credenciais e proteção de CSRF; a simplicidade de depurar ganha e o risco
  fica documentado.
- **Encaixe com as outras frentes:** o `localStorage` guarda o token e o
  `usuario_id` (o id não autentica; serve para a tela saber "esse perfil sou
  eu?"). O `api.ts` manda `Bearer` e mantém o `X-User-Id` só como fallback de
  desenvolvimento. O bypass de `DEBUG` continua no topo de `get_current_user` e
  `get_current_user_opcional`, então B, C e D podem testar no Swagger antes de
  todas as telas usarem o token.
- **Senha e username:** mínimo de 8 e máximo de 32 caracteres (o bcrypt tem
  limite técnico de 72 bytes; a API avisa em caracteres e barra excesso de
  emojis). O username é normalizado para minúsculas; só aceita `a-z`, `0-9` e
  `_`, sem acento, como as redes grandes. Duplicata devolve `409`, inclusive em
  dois cadastros simultâneos (o `UNIQUE` do banco gera `IntegrityError`,
  convertido em `409`). O seed usa a senha `senha-forte-123`; contas criadas
  pelo `POST /usuarios` do slice ficam sem hash e não logam.

### 11. Seed determinístico, com pares de troca garantidos

- **Contexto:** a demo precisa abrir com matches de verdade. Com habilidades
  sorteadas ao acaso, alguns usuários ficariam sem ninguém para trocar.
- **Opções:** sortear tudo com o Faker; montar tudo à mão; pares fixos e
  sorteio só para o resto.
- **Escolha:** 16 pares fixos, em que um sabe o que o outro quer e vice-versa,
  então todo usuário do seed tem pelo menos um match de troca (há teste para
  isso). O Faker cria os nomes, e habilidades extras, posts, curtidas e
  follows saem de um `random.Random(42)`. Por isso a demo é igual em toda
  máquina. As três contas antigas (`ada`, `linus`, `grace`) continuam. O seed
  não roda se o banco já tiver usuários.
- **O que cortamos e por quê:** um seed totalmente aleatório. A cada execução
  a demo mudaria e poderia sair sem trocas.

### 12. Perfil como currículo de troca

- **Contexto:** a decisão de trocar com alguém depende do que a pessoa sabe,
  do que quer aprender e se ela de fato estuda. O perfil precisa resumir isso
  sem virar um currículo frio.
- **Opções:** perfil mínimo (nome, bio e avatar); perfil completo com
  contadores, streak, avaliações como professor, habilidades e posts.
- **Escolha:** perfil completo. A página mostra bio, avatar,
  seguidores/seguindo, streak de estudo, média e total de avaliações
  pós-troca, e os posts da pessoa paginados. O perfil também exibe as
  habilidades separadas em "Sei" e "Quero aprender" quando a pessoa já as
  cadastrou. A edição entrou antes do resto da Feature 3, porque sem ela
  uma conta nova não tinha matches: `/perfil/editar` tem um quadro "Sei" /
  "Quero aprender" com nível, escolhendo do catálogo numa lista, e salva com
  `PUT /usuarios/eu/habilidades` (lista completa, atualiza o índice de
  matches na hora). Trie, autocomplete e mapeamento por IA continuam na
  Feature 3 e entram no lugar da lista.
- **Como ficou:**
  - `GET /usuarios/{username}` é público e devolve `PerfilOut` com `id`,
    `username`, `name`, `bio`, `avatar_url`, `created_at`, `seguidores`,
    `seguindo`, `streak`, `media_avaliacoes`, `total_avaliacoes` e
    `habilidades`.
  - `PATCH /usuarios/eu` permite editar `bio` e `avatar_url` (exige login).
  - `GET /usuarios/{username}/posts` devolve posts paginados (exige login).
  - No frontend, `/perfil/{username}` mostra o perfil, `/perfil/eu`
    redireciona para o perfil logado e `/perfil/editar` edita bio e avatar.

### 13. Deploy: front na Vercel, back no Render com SQLite

- **Contexto:** o bônus de deploy pede uma URL pública que a banca usa. O
  backend é FastAPI com SQLite e guarda o índice de matches em memória.
- **Opções:** tudo na Vercel com o backend em funções serverless e um
  Postgres externo (Supabase); front na Vercel e back no Render.
- **Escolha:** front na Vercel e back no Render (guia 08). Na Vercel rodariam
  várias cópias do backend, cada uma com seu índice de matches em memória, e
  elas se desencontrariam; trocar SQLite por Postgres também sairia da stack
  do projeto.
- **O que aceitamos:** no Render free o disco zera a cada deploy ou
  reinício, e o serviço dorme sem tráfego. O banco volta populado pelo seed
  no boot, e um pinger externo chama `GET /saude` a cada 10 minutos para o
  serviço não dormir na semana da banca. Contas criadas na URL somem no
  próximo deploy. (Resolvido na decisão 15: banco no Neon.)
- **Como ficou:**
  - Render: `SEED_ON_BOOT=true` roda o seed fake no boot quando o banco está
    vazio, antes de montar o índice de matches; `CORS_ORIGINS` recebe a URL
    da Vercel (várias separadas por vírgula). Nunca `DEBUG`.
  - Vercel: Root Directory `frontend` e `NEXT_PUBLIC_API_URL` com a URL do
    Render.
  - `GET /saude` responde `{"ok": true}` sem login e sem tocar no banco.

### 14. Catálogo: trie em memória, autocomplete e IA genérica com fallback

- **Contexto:** a pessoa precisa escolher habilidades de um catálogo fechado
  para o match ser confiável. A experiência de rolar uma lista de 48 itens
  toda vez era ruim, e erros de digitação como "pytom" precisavam ser
  corrigidos sem criar novas habilidades.
- **Opções:** busca SQL com `LIKE '%texto%'`; índice em memória com trie;
  Elasticsearch/Meilisearch; deixar tudo no frontend.
- **Escolha:** trie em memória no backend. Cada nó guarda um dicionário de
  filhos e um conjunto de ids de habilidades que terminam naquele prefixo. A
  busca por prefixo percorre os caracteres normalizados (casefold e sem
  acento) e devolve os ids em ordem alfabética. A trie é reconstruída uma
  vez no `lifespan`, junto com o seed e o índice de matches.
- **O que cortamos e por quê:** busca SQL `LIKE` (escalaria com o catálogo e
  perderia a ordenação por proximidade do prefixo) e motor de busca externo
  (adicional de infra fora da stack do projeto).
- **Como ficou:**
  - `backend/app/core/catalogo.py` tem a `TrieDeHabilidades`, singleton
    carregado no startup.
  - `GET /habilidades/autocomplete?prefixo=...&limite=...` devolve sugestões
    em O(P + L), onde P é o tamanho do prefixo e L o limite de resultados.
  - O frontend substituiu o `<select>` por um campo de busca com dropdown de
    sugestões e chips clicáveis do catálogo. Habilidades adicionadas vão para
    colunas "Sei" e "Quero aprender", com botão de mover e remover — o
    arrastar foi cortado porque quebrava em telas touch e não agregava
    usabilidade real.
  - `POST /habilidades/mapear` recebe um texto digitado e devolve a
    habilidade correspondente, se houver. A lógica é:
    1. Tenta a IA genérica (OpenAI, Groq ou Gemini, configurável por
       `IA_PROVIDER` e `IA_API_KEY`).
    2. Se a chave estiver vazia ou a chamada falhar, cai no fallback
       `difflib` com texto/nomes normalizados (casefold, sem acento) e
       cutoff 0.5.
    3. Se nenhum dos dois encontrar, a resposta é `null` e o frontend mostra
       "Escolha uma habilidade da lista".
  - A IA só mapeia para itens que já existem no catálogo; nunca cria novos.
    Isso evita poluição do catálogo e mantém o match determinístico.
- **Big O:**
  - Autocomplete: O(P + L) na trie, mais O(L) no banco para completar nome e
    categoria.
  - Mapeamento: O(N) para montar a lista de nomes (N = tamanho do catálogo),
    onde a chamada de IA é dominante em latência, não em complexidade.
  - Fallback difflib: O(N × M) no pior caso, onde M é o tamanho médio dos
    nomes, mas roda só quando a IA falha e o catálogo é pequeno.

## Features

| Feature | Dono | Por quê (1 frase) |
|---|---|---|
| Auth (núcleo) | @italoosilva | Sem login não existe troca entre pessoas. |
| Perfil com nível e habilidades (núcleo + diferencial) | @italoosilva | O perfil é o "currículo" que decide se vale trocar com alguém. |
| Catálogo de habilidades com autocomplete e IA | @italoosilva | Garante que o match compare a mesma habilidade. |
| Posts de rotina com tempo e foto (núcleo) | @NicoleAlverga | Mostra que a pessoa estuda aquilo de verdade. |
| Curtidas e comentários (núcleo) | @NicoleAlverga | Motivação e dúvidas rápidas na rotina dos outros. |
| Feed misto (núcleo) | @NicoleAlverga | Ajuda a descobrir quem pode te ensinar. |
| Streak de estudo | @NicoleAlverga | Incentiva a voltar todo dia. |
| Follow (núcleo) | @gecbeltrao | Acompanhar quem estuda o mesmo que você. |
| Match em dois níveis | @gecbeltrao | É o centro do produto. |
| Seed fake (núcleo) | @gecbeltrao | A demo começa com matches de verdade. |
| Chat 1-para-1 | @ltodarosouza | É onde a troca é combinada. |
| Agendamento de troca | @ltodarosouza | Marca a troca e avisa quando avaliar. |
| Avaliação pós-troca | @ltodarosouza | Passa confiança sobre quem ensina bem. |
| Deploy | @ltodarosouza | Bônus de +10 e banca testando na URL. |

Extras, só depois de tudo acima pronto: notificações, trending de habilidades
e badges.

## Uma escolha técnica

_(a preencher)_ Candidata principal: o índice invertido do match em
`backend/app/core/matches.py`. Para cada habilidade, guardamos quem sabe e
quem quer aprender. O match de troca vira uma interseção de conjuntos, sem
varrer todos os usuários. Expliquem o Big O e, se der, meçam com `make bench`
contra a versão que percorre todos os usuários.

## Uso de IA

- Claude para ajudar a definir o produto, recortar o escopo e dividir as
  frentes.
- IA dentro do produto: mapear a habilidade digitada para um item do catálogo.
- Frente D (chat, agendamento e avaliação): Claude Code planejou a frente,
  escreveu os models, schemas e o contrato do `api.ts`, e dividiu o resto em
  tarefas pequenas para agentes do Codex (GPT-6 Luna) em paralelo, um arquivo
  por agente. Claude revisou cada entrega, rodou os testes e conferiu as
  telas no navegador antes de mesclar.
- Frente C (follow): Claude Code escreveu model, service, rotas, testes e as
  telas de seguidores/seguindo seguindo o slice de usuários, e conferiu o
  botão de seguir no navegador. Um subagente revisor apontou bugs no
  frontend (erro engolido, resposta velha na lista, hydration), que foram
  corrigidos antes do PR.
- Frente A (auth e perfil): IA escreveu models, schemas, services, rotas,
  testes e as telas de login/cadastro e perfil, revisou a integração com o
  follow e realizou os testes (incluindo testes visuais no navegador) antes
  do PR.
- Frente B (posts e comentários, frontend): Claude Code escreveu o contrato
  em `lib/posts.ts` e dividiu as telas em tarefas curtas para agentes do Codex
  (GPT-6 Luna), em duas ondas e um dono por arquivo. Dois revisores Luna só de
  leitura (lógica e design) apontaram achados; Claude fez a triagem, corrigiu
  os reais e testou criar post com e sem foto, apagar, comentar e curtir no
  navegador, em 375 px e nos dois temas.
- Notificações (issue #50): Claude Code dividiu a issue em nove tarefas
  pequenas para agentes do Codex (GPT-6 Luna), em ondas e com um dono por
  arquivo: model e migração, schemas, service, router, testes, lib com o
  hook, item, toast e página. Claude revisou cada entrega, corrigiu o hook
  (timer do toast reiniciando a cada consulta e polling que não começava
  depois do login), rodou a suíte e testou o toast, a página e o "seguir de
  volta" no navegador, em 375 px e nos dois temas.
- _(completem conforme usarem)_

### 15. Banco de produção no Postgres do Neon, com migrações Alembic

- **Contexto:** com SQLite no disco do Render (decisão 13), cada deploy
  apagava contas, posts e habilidades criadas na URL pública.
- **Opções:** Postgres do Render (o grátis expira em 30 dias); Supabase (pausa
  o projeto depois de uma semana sem consultas, e o pinger não toca no banco);
  Neon (grátis sem prazo, dorme parado e acorda em menos de um segundo).
- **Escolha:** Neon em produção. O backend continua no Render e só troca a
  `DATABASE_URL`. Local e testes seguem em SQLite, sem nada para instalar.
- **O que veio junto:** com um banco que não zera, `create_all` não basta,
  porque cria tabelas novas mas não adiciona colunas. Entraram migrações com
  Alembic:
  - em Postgres, o boot roda `alembic upgrade head` antes de tudo; em SQLite
    continua o `create_all`;
  - mudou um modelo? rode `make migracao m="o que mudou"`, revise o arquivo
    gerado em `backend/migrations/versions/` e commite junto;
  - `tests/test_migracoes.py` falha se algum modelo mudar sem migração;
  - para rodar a suíte num Postgres: `TEST_DATABASE_URL=... make test`.
- **Como ficou:** `DATABASE_URL` no Render aponta para o Neon (aceita
  `postgres://` ou `postgresql://`). O seed do boot só roda com o banco vazio,
  ou seja, uma vez.

### 21. Notificações montadas na leitura, com polling de 15 s

- **Contexto:** ninguém ficava sabendo de curtida, comentário, seguidor,
  proposta de troca ou avaliação sem abrir cada tela. A issue pedia isso sem
  mexer nos models e services das outras áreas.
- **Opções:** tabela de notificações gravada a cada ação (exigiria editar os
  services de curtida, comentário, follow e troca); notificações derivadas na
  leitura a partir das tabelas que já existem; WebSocket/SSE para empurrar em
  tempo real.
- **Escolha:** derivar na leitura. A única tabela nova é
  `leituras_notificacoes` (`usuario_id` único, `lidas_ate`): um item é lido
  quando `em <= lidas_ate`. Tempo real por polling de
  `GET /notificacoes/nao-lidas` a cada 15 s.
- **O que cortamos e por quê:** gravar notificação por ação (quebraria a regra
  de arquivos exclusivos da rodada); WebSocket/SSE (o backend no Render dorme
  e reinicia, e 15 s atende o "pronto quando"); notificação de match novo (não
  há registro de quando um match surge, só o índice em memória).
- **Como ficou:**
  - `GET /notificacoes`, `GET /notificacoes/nao-lidas` (contrato C2) e
    `POST /notificacoes/lidas`. Tipos: `curtida` (agrupada por post e dia UTC:
    "Bia e mais 3 curtiram seu post"), `comentario`, `seguidor`,
    `troca_proposta`, `troca_confirmada`, `troca_recusada` e `avaliacao`.
    Ação da pessoa sobre si mesma nunca vira notificação.
  - O service monta a lista inteira em Python (uma consulta por tipo, atores
    carregados de uma vez), ordena por data e fatia `offset`/`limit`.
  - `useNotificacoes()` em `lib/notificacoes.ts`: consulta ao montar, a cada
    15 s com a aba visível e na volta para a aba. Com a aba escondida só
    continua (a cada 60 s) se a permissão de notificação do navegador já foi
    dada, para avisar proposta de troca. Não pede permissão: reaproveita a do
    chat. Erro ou 404 vira "sem dado".
  - Página `/notificacoes` agrupada em "Hoje", "Esta semana" e "Antes"; ao
    abrir, marca tudo como lido, mas mantém o destaque das não lidas naquela
    visita.
  - `<ToastNotificacoes />` foi montado no `layout.tsx` (exceção combinada à
    regra de arquivos exclusivos, como já é feito com `<AvisoAvaliacao />`):
    canto superior direito no desktop, embaixo no celular.
- **Big O:** cada consulta é O(C + M + S + T + A) no número de curtidas e
  comentários nos posts da pessoa, seguidores, trocas e avaliações recebidas,
  mais O(n log n) para ordenar. Se um perfil ficar grande, o próximo passo é
  limitar a janela (ex.: últimos 90 dias) ou guardar um contador.
