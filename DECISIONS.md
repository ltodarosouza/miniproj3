# Decisões do time

**Time:** @italoosilva (Pessoa A), @NicoleAlverga (Pessoa B), @gecbeltrao (Pessoa C) e @ltodarosouza (Pessoa D)

**Rede:** Colmatch, troca de habilidades entre iniciantes em tech.

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
- **Onde o nicho aparece:** o catálogo reúne habilidades de programação e disciplinas da base (`backend/app/services/habilidades.py`, `CATALOGO`); o seed monta 32 pessoas, pares de troca garantidos e posts de rotina de estudo, metade com foto ligada à habilidade (`backend/scripts/seed.py`); a interface traz o Feed/Diário com “O que você estudou hoje?” e o livro de pares em `/matches` (decisões [32](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md), [33](docs/decisoes/33-mesa-diario-e-cotacao.md) e [36](docs/decisoes/36-pares-e-busca.md)).

## Decisões em destaque

O time registrou cada decisão à medida que o produto mudou; estas cinco são as que mudaram o que a rede é.

| Decisão | Escolha | O que cortamos e por quê |
|---|---|---|
| [1. Match em dois níveis](#1-match-em-dois-níveis) | Separar quem pode ensinar de quem tem troca recíproca, destacando os pares de troca. | Troca recíproca pura deixaria muita gente sem resultado numa rede pequena. |
| [2. Agendamento interno, sem login com Google](#2-agendamento-interno-sem-login-com-google) | Propor e confirmar horário no chat; abrir evento preenchido no Google Agenda. | OAuth exigiria consentimento e usuários de teste no Google Cloud; o link resolve o uso prático. |
| [3. A IA só traduz para o catálogo, não cria habilidade](#3-a-ia-só-traduz-para-o-catálogo-não-cria-habilidade) | Mapear a entrada para habilidades existentes e pedir escolha quando não houver correspondência. | Criar habilidades pela IA poluiria o catálogo e reduziria a confiabilidade do match. |
| [5. Feed com meus posts, quem eu sigo e quem pode me ensinar](#5-feed-com-meus-posts-quem-eu-sigo-e-quem-pode-me-ensinar) | Feed cronológico com posts próprios, de seguidos e de quem pode ensinar, com motivo. | Feed só de seguidos deixava vazia a descoberta e removia os próprios posts. |
| [28. Troca só avalia o que aconteceu](docs/decisoes/28-troca-so-avalia-o-que-aconteceu.md) | Confirmar antes do horário e permitir uma proposta pendente por par. | Cortamos índice único parcial por diferenças e migrações entre SQLite e Postgres; a criação serializada evita duplicatas. |

A decisão 1 é a escolha que vai para o vídeo/pitch, conforme [docs/AVALIACAO.md](docs/AVALIACAO.md).

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
- **Como ficou:** `GET /matches` devolve `troca`, `pode_te_ensinar` e
  `em_andamento` (decisão 17). Quem está na troca não se repete na outra lista. Dentro de cada grupo, vem
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
- **Escolha:** agendamento interno. No chat, um propõe dia, horário e
  habilidades, e o outro confirma. Cada um tem o botão "Agendar no Google
  Agenda", que abre o evento preenchido; o Meet é adicionado lá (decisão 17).
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

### 5. Feed com meus posts, quem eu sigo e quem pode me ensinar

- **Contexto:** o feed precisa ajudar a pessoa a descobrir com quem aprender.
  No teste de 22/11 a publicação "sumia" ao recarregar: o feed tirava os
  posts da própria pessoa, e quem não seguia ninguém via o feed vazio.
- **Opções:** só posts de quem eu sigo; seguidos mais posts de quem sabe o que
  eu quero aprender; os dois mais os meus.
- **Escolha:** feed misto, em ordem cronológica, com motivo em cada post:
  `meu`, `seguindo`, `pode_te_ensinar` e `descobrir` (quem marcou alguma
  habilidade igual às minhas). O conjunto de autores não depende de quantos
  posts já existem, para a paginação não pular posts quando alguém publica
  no meio da rolagem.
- **O que cortamos e por quê:** o feed ranqueado por engajamento. Para quem
  quer aprender, importa ver quem estuda aquilo agora, não o post mais curtido.
  Completar com posts aleatórios de quem não tem nada em comum também ficou
  fora: encheria a tela sem ajudar a achar professor.

### 6. Visual de rede social conhecida, com movimento caprichado

- **Contexto:** quatro pessoas constroem telas em paralelo, e o público é
  iniciante e precisa se sentir em casa.
- **Opções:** um visual temático (álbum de figurinhas, tabela periódica,
  quadro branco) ou o padrão de rede social executado com capricho.
- **Escolha:** o padrão de rede social, limpo e acolhedor, em verde-azulado,
  com tema claro e escuro e movimento fluido (arrastar habilidades,
  transições suaves; a parte de efeitos que seguiam o mouse foi revista na
  decisão 20). Detalhes no [DESIGN.md](DESIGN.md).
- **O que cortamos e por quê:** os visuais temáticos. Seriam mais marcantes,
  mas mais difíceis de reproduzir igual em quatro frentes e mais arriscados
  de parecer infantis. A personalidade fica no movimento e nos detalhes.

### 7. Chat por polling, com o id da última mensagem como cursor

- **Contexto:** a conversa precisa mostrar as mensagens novas sem a pessoa
  recarregar a página. WebSocket está fora do escopo.
- **Opções:** recarregar a conversa inteira a cada poucos segundos; buscar só
  o que chegou depois de uma data; buscar só o que chegou depois do id da
  última mensagem.
- **Escolha:** a tela pergunta a cada 1,5 segundo
  `GET /dms/{username}?depois_de=<id>` e recebe só as novas. O polling pausa
  com a aba escondida. O id é crescente e único, então não perde nem repete
  mensagens enviadas no mesmo segundo, o que a data não garante.
- **O que cortamos e por quê:** WebSocket e "digitando...". Exigiriam um
  servidor com conexão aberta e complicariam o deploy. A decisão 16 complementa
  esta com envio otimista, entregue/visto e contagem de não lidas.

### 8. Troca proposta no chat, avaliada só depois do horário

- **Contexto:** a rede só pode pedir avaliação de uma troca que aconteceu, e
  nem toda troca é recíproca ("pode te ensinar").
- **Opções:** avaliar a pessoa a qualquer momento; avaliar a troca depois do
  horário marcado.
- **Escolha:** a troca guarda o que quem propôs ensina e o que aprende, e
  basta uma das duas. Ela nasce `proposta`, só quem recebeu confirma ou recusa,
  e a avaliação abre para os dois quando o horário de uma troca confirmada
  passa. Cada pessoa avalia uma vez por troca. O pedido aparecia num cartão
  flutuante em qualquer tela; desde a decisão 39, aparece no cartão da troca,
  dentro da conversa, com aviso no selo de Mensagens.
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

### 16. Chat com entregue/visto, não lidas e trocas na conversa

- **Contexto:** o chat precisava mostrar entrega e leitura, sinalizar mensagens
  e propostas recebidas e incluir conversas que começam por uma troca.
- **Opções:** derivar tudo em cada consulta; guardar leitura de conversa e os
  estados das mensagens; persistir notificações separadas.
- **Escolha:** `mensagens.entregue_em` e `mensagens.lida_em` registram estados.
  `leitura_conversas` guarda até quando cada pessoa abriu uma conversa, então
  uma proposta recebida conta como não lida até a conversa ser aberta. A lista
  de conversas combina mensagens e trocas, e `/dms/nao-lidas` é o contrato C1.
  O chat usa polling de 1,5 s, com envio otimista no front. O `cliente_id`
  torna o envio idempotente e é a chave de reconciliação da mensagem otimista,
  sempre junto com o remetente (é único por quem envia, não no banco todo).
- **O que veio junto:** em SQLite o boot só roda `create_all`, que cria tabela
  nova mas não coluna nova. `completar_esquema_sqlite` (em `main.py`) adiciona
  as colunas e índices que faltam num `app.db` antigo sem apagar dados, então
  ninguém precisa recriar o banco local ao puxar esta mudança. Coluna
  obrigatória nova ainda exige `rm backend/app.db && make seed`.
- **O que cortamos e por quê:** tabela de notificações por mensagem ou troca;
  mensagens e propostas existentes já permitem derivar o contador, enquanto a
  leitura por conversa preserva o estado da proposta sem alterar o modelo de
  troca.

### 17. Do match à troca: horário por toque, habilidades do par e Meet pelo Google Agenda

- **Contexto:** no teste de 22/11 vieram quatro relatos: digitar a data
  inteira no agendamento, os campos "Você ensina/aprende" listando o catálogo
  inteiro, um campo de link da chamada que ninguém sabia preencher e quem já
  conversa continuar aparecendo em Matches.
- **Opções:** manter os campos nativos de data e hora ou um calendário próprio;
  filtrar as habilidades no front ou pedir ao backend; criar o Meet pela API
  do Google Agenda (OAuth) ou pelo link de template; esconder quem já conversa
  ou mover para uma seção própria.
- **Escolha:**
  - `SeletorDeHorario`: calendário do mês sempre aberto, atalhos "Hoje",
    "Amanhã" e "Sábado" e chips de horário de 08:00 a 22:00, de 30 em 30 min.
    Sem dependência nova, só `Intl.DateTimeFormat` e grade em CSS.
  - `GET /trocas/opcoes/{username}` devolve `eu_ensino` (o que eu sei e a
    pessoa quer aprender) e `eu_aprendo` (o que ela sabe e eu quero). O
    formulário mostra só esses chips, já marcados quando há uma opção só, e
    "Outra habilidade" abre o catálogo para combinar algo fora do perfil.
  - O formulário não tem mais link. O cartão da troca confirmada tem o botão
    principal "Agendar no Google Agenda", com a dica de clicar em "Adicionar
    videoconferência do Google Meet" e salvar.
  - `GET /matches` ganha `em_andamento`: quem já trocou mensagem ou tem troca
    comigo sai de `troca` e `pode_te_ensinar` e vai para uma seção recolhida.
    Troca recusada não conta: a pessoa volta para as seções principais.
- **O que cortamos e por quê:** criar o Meet automaticamente. O link de
  template do Google Agenda não cria a sala, e a API exige o OAuth que a
  decisão 2 cortou. `link_meet` continua no model (o seed usa), mas o
  formulário não envia mais e o backend ignora o campo.
- **Big O:** as opções fazem duas consultas, uma por pessoa, e cruzam os
  dicionários em O(h), sendo h o número de habilidades das duas. O
  `em_andamento` faz duas consultas extras (mensagens e trocas) limitadas aos
  candidatos do índice.

### 18. Editor de habilidades por toque, mesma skill nos dois tipos

- **Contexto:** o editor anterior exigia buscar cada habilidade pelo nome, uma
  por uma. A UX bloqueava o onboarding e impedia marcar a mesma habilidade como
  "sei" e "quero aprender" ao mesmo tempo.
- **Opções:** manter o autocomplete; nuvem de chips com abas separadas; nuvem
  com estado no próprio chip.
- **Escolha:** nuvem de chips com ciclo de estado por toque: neutro → Sei →
  Quero aprender → Os dois → neutro. A mesma habilidade pode ter os dois tipos
  com níveis independentes. O backend valida por `(habilidade_id, tipo)`, não
  por `habilidade_id` sozinho.
- **O que cortamos e por quê:** sugestões dinâmicas via `/matches` (dependência
  de runtime; fica como melhoria futura); animação com mola (complexidade
  desnecessária na primeira entrega).
- **Como ficou:** `EditorHabilidades.tsx` com chips clicáveis, filtro de busca
  inline, níveis separados por tipo e resumo vivo ("Você sabe X coisas e quer
  aprender Y"). `salvar_habilidades` no backend recusa apenas repetição exata
  de `(habilidade_id, tipo)`. Testes em `test_habilidades_usuario.py`.

### 19. Home em 3 colunas, busca sem acento e fotos guardadas no banco

- **Contexto:** relatos de 22/11: post que some ao recarregar, não dá para
  editar, faixa vazia dos lados no notebook e nenhuma busca de posts ou
  habilidades. As fotos ficavam em `uploads/` no disco do Render, que zera a
  cada deploy (decisão 13), e o post ficava com link quebrado.
- **Opções:** para as fotos, Vercel Blob, Cloudinary ou uma tabela de bytes
  no Neon; para a busca, `ILIKE` no banco, índice de texto do Postgres ou
  comparação em Python; para a home, coluna única mais larga ou grade
  feed | descoberta, como X, Instagram e LinkedIn.
- **Escolha:**
  - Fotos na tabela `imagens_post` (nome, post, tipo, bytes), servidas por
    `GET /posts/imagens/{nome}` com cache de um ano. Não exige conta nova nem
    chave, e sobrevive a deploy porque mora no Neon. Arquivos antigos que
    ainda estejam no disco continuam servidos.
  - `GET /busca?q=&tipo=pessoas|posts|habilidades` e
    `GET /busca/habilidades/{id}`, comparando com `normalizar()` do catálogo
    (casefold sem acento), o mesmo para SQLite e Postgres.
  - Home em grade `feed (até 600 px) | coluna de 20 rem` a partir de 1024 px.
    A coluna é fixa ao rolar e traz busca, progresso da semana, "Pode te
    ensinar" (de `GET /matches`, só leitura) e "Em alta esta semana"
    (`GET /feed/em-alta`). Abaixo de 1024 px a coluna some e "Pode te
    ensinar" vira carrossel depois do 3º post.
- **O que cortamos e por quê:** Cloudinary e Vercel Blob (conta e segredo a
  mais a quatro dias da entrega); índice de texto do Postgres (não roda no
  SQLite dos testes e do dev); vídeos curtos ("Pílulas"), que ficam para uma
  sub-issue P2 depois de tudo isto na `main`.
- **Como ficou:**
  - `Post.editado_em` (migração 0004) é preenchido só quando algo muda de
    verdade; o cartão mostra "· editado". O menu "⋯" do autor tem Editar
    (texto, habilidade e minutos no próprio cartão, Esc cancela) e Apagar.
  - Composer compacto "O que você estudou hoje?" que abre ao tocar; o link
    `/feed?publicar=1` da casca (decisão 20) também abre. Rolagem infinita
    com IntersectionObserver, puxar para atualizar e toque duplo para curtir.
  - `/busca` com abas Pessoas · Publicações · Habilidades, debounce de
    300 ms, termo e aba na URL, e "Recomendados" quando o campo está vazio.
    Cada habilidade abre quem sabe, quem quer aprender e os posts sobre ela.
  - `GET /feed/meu-progresso` devolve sequência, minutos e posts dos
    últimos 7 dias.
- **Big O:** a busca percorre pessoas, posts ou habilidades em Python:
  O(U), O(P) ou O(H) por consulta. Com a rede da turma isso leva
  milissegundos; se crescer, o próximo passo é uma coluna normalizada
  indexada ou `unaccent` + `pg_trgm` no Postgres. "Em alta" é um
  `GROUP BY` nos posts da semana.

### 20. Casca de rede social: painel lateral no computador, barra inferior no celular, movimento por ação

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
  - `/nao-lidas` devolve `{"total", "ultima_em"}`. O `total` é o C2;
    `ultima_em` existe porque uma curtida nova num grupo já não lido não muda
    o total, e o front precisa perceber que algo chegou para mostrar o toast.
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

### 22. Foto de perfil por arquivo e compressão da foto no navegador

- **Contexto:** issue #59. Foto de celular (3 a 8 MB) passava do limite de
  2 MB e era recusada; arquivos da câmera sem extensão davam 422; não dava
  para mexer na foto ao editar o post; a foto de perfil só aceitava URL.
- **Opções:** subir o limite do servidor, comprimir no servidor (Pillow) ou
  comprimir no navegador antes do upload.
- **Escolha:**
  - `prepararImagem()` em `lib/imagens.ts` redimensiona no canvas (lado maior
    1600 px no post, 512 px no avatar) e exporta webp/jpeg abaixo de 2 MB. O
    servidor mantém o limite de 2 MB.
  - O backend ignora o nome e o `content-type` enviados: decodifica a imagem
    com Pillow (JPEG, PNG ou WebP, até 40 MP) e grava o formato detectado.
    Arquivo truncado ou corrompido dá 422 e não substitui a foto anterior. As
    rotas que servem imagens enviam `X-Content-Type-Options: nosniff`.
  - Avatar guardado como bytes na tabela `imagens_avatar` (migração 0005, um
    por usuário; o downgrade limpa os `avatar_url` internos),
    mesmo padrão da decisão 19: `POST`/`DELETE /usuarios/eu/avatar` e
    `GET /usuarios/avatares/{nome}` com cache de um ano.
  - `DELETE /posts/{id}/imagem`; o editor do post adiciona, troca e remove a
    foto ao salvar.
- **O que cortamos e por quê:** redimensionar no servidor (a compressão fica
  no navegador; o Pillow só valida, e o limite de 2 MB mantém o custo baixo);
  recorte do avatar (o `object-cover` já centraliza); limite do corpo antes do
  parser multipart (exige middleware global, fora da #59).

### 23. Streak conta o dia no fuso do Brasil

- **Contexto:** issue #58. O streak agrupava os posts pelo dia em UTC. Post
  depois das 21h (horário de Brasília) contava para o dia seguinte, e a chama
  da navegação apagava à noite mesmo com post feito. Ela também demorava até
  1 minuto para acender depois de publicar.
- **Opções:** fuso fixo UTC−3, `America/Sao_Paulo` nomeado, ou o fuso do
  navegador de cada pessoa.
- **Escolha:**
  - Um único fuso para o produto: `America/Sao_Paulo`. Backend com
    `ZoneInfo` (`FUSO_BRASIL` e `dia_no_brasil()` em `core/streak.py`, com o
    pacote `tzdata` para não depender da base de fusos do servidor). Frontend
    com `Intl.DateTimeFormat(..., { timeZone: "America/Sao_Paulo" })` em
    `useStreak`, para a chama e o contador virarem o dia no mesmo instante,
    inclusive para quem está em outro fuso (ex.: Manaus).
  - `criarPost` e `apagarPost` disparam `troca:posts-mudaram`; `useStreak`
    escuta esse evento e a volta para a aba, além do intervalo de 60 s. Uma
    consulta por vez: o intervalo pula se já houver uma em andamento, e um
    evento no meio dela agenda uma nova leitura no final.
- **O que cortamos e por quê:** fuso por pessoa (o público é brasileiro e o
  dia do streak precisa ser o mesmo no servidor e na tela).

### 24. Uma régua de alinhamento para a casca e os cartões

- **Contexto:** issue #64. Elementos que deveriam ficar alinhados começavam em
  colunas diferentes: na navegação lateral larga, o logo, os ícones do menu, o
  tema e o "Sair" tinham centros diferentes. Os itens de notificação ficavam
  12 px para dentro dos títulos, e os cabeçalhos das duas colunas de mensagens
  tinham alturas diferentes. No celular, os botões do perfil espremiam o nome.
- **Opções:** ajustar cada caso com valores soltos, ou fixar algumas regras
  e corrigir pelos tokens que já existem.
- **Escolha:**
  - Na navegação lateral, o logo, os itens do menu, o tema e o Sair têm o
    ícone numa caixa `size-9` encostada na borda interna, e os rótulos
    começam na mesma coluna (`gap-3`). "Publicar" é um botão e continua
    centralizado. A nav rola por dentro quando falta altura, para o Sair
    nunca sair da tela.
  - Item de lista com fundo próprio (não lida, hover) usa margem negativa
    igual ao padding (`-mx-3` com `p-3`, como o `-mx-2 px-2` de Em alta), para
    o conteúdo ficar na coluna dos títulos.
  - Cabeçalhos lado a lado têm altura fixa igual (`h-16`).
  - Todo contêiner que repete `rounded-cartao border bg-superficie` também
    leva `shadow-cartao`, igual ao `Cartao`.
  - Ações ao lado de um nome descem para a linha de baixo abaixo de `sm`.
- **O que cortamos e por quê:** a assimetria de padding do cabeçalho do
  celular fica como está, porque compensa o respiro interno dos botões de 44 px.
  Arquivos de outras issues (`CartaoPost`, `Streak`, `Avatar`, `app/feed`)
  ficaram de fora.

### 25. Fotos do seed por URL externa fixa

- **Contexto:** issue #62. Os posts dos usuários falsos eram só texto e
  ninguém tinha foto de perfil, então o feed parecia vazio na apresentação.
- **Opções:** guardar arquivos de foto no repositório e gravar como
  `ImagemPost`, usar `picsum.photos` (aleatório, sem relação com o post) ou
  apontar para URLs fixas de fotos escolhidas.
- **Escolha:** URLs absolutas e fixas. Avatares vêm de
  `randomuser.me/api/portraits/{women|men}/<n>.jpg`, sem repetir, com o gênero
  sorteado junto com o nome. Posts usam fotos do Unsplash por ID, agrupadas por
  tema (`FOTOS_POR_TEMA`) e ligadas às habilidades do catálogo
  (`TEMA_POR_HABILIDADE`; o que não está na tabela usa "estudo"). Cerca de 45%
  dos posts ganham foto, e há 10 posts extras de progresso com foto nas
  últimas 48 horas. Tudo sai do mesmo `random.Random(SEMENTE)`.
- **O que cortamos e por quê:** arquivos locais em `seed_fotos/` deixariam o
  repositório pesado sem ganho na apresentação. Sem internet, o `Avatar` e o
  `CartaoPost` já caem na inicial ou escondem a foto, então nada quebra.

### 26. Ícone do site: favicon.ico, PNG 32 e SVG, sem trocar o desenho

- **Contexto:** issue #63. O ícone não aparecia de forma confiável na aba.
  Medindo o HTML do build, a causa era maior que a falta do `.ico`: como o
  `layout.tsx` definia `metadata.icons` só com `apple`, o Next deixava de
  gerar a tag do `app/icon.svg`, e a página não tinha nenhum
  `<link rel="icon">`.
- **Opções:** tirar o `metadata.icons` e depender só dos arquivos de
  convenção (`app/icon.*`, `app/apple-icon.png`), ou declarar tudo
  explicitamente; manter as setas de troca ou desenhar um ícone novo.
- **Escolha:** `app/favicon.ico` com 16/32/48 (o Next gera a tag dele
  sozinho) e, em `metadata.icons`, `icone-32.png`, `icon.svg` (por último,
  para Chrome/Firefox/Edge preferirem o SVG) e o `apple-touch-icon.png` de
  180×180. Os dois arquivos novos foram renderizados do `icon.svg` com
  `resvg-py` + Pillow (`uv run --with resvg-py --with pillow`). O desenho das
  setas continua o mesmo. Os PNGs do manifest (192/512) e o apple-touch já
  eram quadrados de fundo sólido iguais ao `icone-base.svg`, com as setas
  dentro dos 80% centrais, então o mesmo 512 serve para `any` e `maskable`.
- **O que cortamos e por quê:** um ícone novo mais marcante ficaria para uma
  decisão de marca do time, não desta correção. O script de geração não foi
  versionado: são só dois arquivos. Para refazer, renderize o `icon.svg` com
  `resvg_py.svg_to_bytes(svg_path="frontend/app/icon.svg", width=N, height=N)`
  em 16, 32 e 48; salve o de 32 como `frontend/public/icone-32.png` e junte os
  três com Pillow em `frontend/app/favicon.ico`
  (`img48.save(..., format="ICO", sizes=[(16,16),(32,32),(48,48)])`).


## Decisões da repaginada Colmatch

Rodada da auditoria e da repaginada Colmatch (decisões a partir da 27). Cada decisão desta rodada está em `docs/decisoes/<número>-<nome>.md`. Não há decisão 35.

- [27. Bypass `X-User-Id` só no dev: produção recusa o boot com DEBUG](docs/decisoes/27-bypass-so-no-dev.md).
- [28. Troca só avalia o que aconteceu](docs/decisoes/28-troca-so-avalia-o-que-aconteceu.md).
- [29. Índice com tranca e normalização única](docs/decisoes/29-indice-com-tranca-e-normalizacao-unica.md).
- [30. Cursor temporal e leitura atômica](docs/decisoes/30-cursor-temporal-e-leitura-atomica.md).
- [31. Erro honesto em post apagado, limite de 5 posts por minuto e validação única de upload](docs/decisoes/31-erro-honesto-e-limite-de-posts.md).
- [32. Identidade Colmatch e sistema visual “Bolsa de saberes”](docs/decisoes/32-identidade-colmatch-bolsa-de-saberes.md).
- [33. Mesa, Diário e cotação da semana](docs/decisoes/33-mesa-diario-e-cotacao.md).
  Atualizada a pedido do dono: a tela volta a se chamar Feed.
- [34. Mensagens e sessão encerrada](docs/decisoes/34-mensagens-e-sessao-encerrada.md).
- [36. Livro de pares e busca em paleta](docs/decisoes/36-pares-e-busca.md).
  Com aval do dono, o escopo da #83 passou a incluir as habilidades públicas
  nos itens de `GET /usuarios`, carregadas em lote para a página solicitada.
- [37. A proposta de troca vira uma ordem numerada, e confirmar celebra](docs/decisoes/37-trocas-como-ordem.md).
- [38. Notificações como registro de atividade, com cursor opaco no front](docs/decisoes/38-notificacoes-registro-e-cursor.md).
- [39. Mais estudadas por horas, coluna com respiro e avaliação dentro da conversa](docs/decisoes/39-ranking-por-horas-respiro-e-avaliacao-na-conversa.md).
  Pedido direto do dono; substitui o cartão flutuante de avaliação da decisão 8.
  Atualizada a pedido do dono: a coluna encosta na borda direita em telas largas.
- [40. Símbolo do Colmatch vira uma colmeia](docs/decisoes/40-logo-colmeia.md).
  Pedido direto do dono; substitui o desenho de três células da decisão 32.
- [41. Feed com mais imagem](docs/decisoes/41-feed-com-mais-imagem.md).
  Pedido direto do dono.
- [42. Foto do post abre em tela cheia](docs/decisoes/42-foto-do-post-em-tela-cheia.md).
  Issue #106; o toque na foto amplia a imagem inteira, e seguidores/seguindo
  seguem como página (o modal estilo Instagram foi descartado).
- [43. Lupa da foto vira cartão, e a página não rola por trás](docs/decisoes/43-lupa-com-cartao-e-rolagem-travada.md).
  Pedido direto do dono; refina a decisão 42 com legenda, fundo desfocado e rolagem travada.
- [44. Recorte da foto do post e texto longo sem espaço](docs/decisoes/44-recorte-da-foto-e-texto-longo-sem-espaco.md).
  Pedido direto do dono; editor de recorte sem dependência nova e quebra de sequências longas no direct, posts e comentários.

## Features

Dono é quem abriu o PR que entregou a feature; quando uma entrega posterior foi
de outra pessoa, as duas aparecem com o número do PR.

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
| Notificações | @ltodarosouza | Mantêm a pessoa informada sobre atividade e mensagens. |
| Busca de pessoas e habilidades | @gecbeltrao (busca, #56); @ltodarosouza (repaginada em paleta, #87) | Ajuda a encontrar pessoas e habilidades relevantes. |
| Feed/Diário com cotação da semana (antes chamado Mesa) | @gecbeltrao | Reúne a rotina de estudo e o contexto das habilidades em alta. |
| Fotos de post e de perfil | @NicoleAlverga (foto do post, #31); @ltodarosouza (foto de perfil por arquivo, #65) | Dá contexto visual às publicações e aos perfis. |
| Identidade Colmatch | @ltodarosouza | Dá unidade visual e nome à rede. |

**Ficou de fora, e por quê:**

- **Badges e ranking de pessoas:** viram métrica de vaidade e não aproximam
  ninguém de uma troca; a sequência de estudo e a avaliação pós-troca já dão o
  sinal de quem estuda e de quem ensina bem.
- **Login com Google (OAuth):** pediria consentimento e usuários de teste no
  Google Cloud; o link preenchido do Google Agenda resolve (decisão 2).
- **WebSocket no chat:** exigiria conexão aberta no servidor e complicaria o
  deploy; polling com o id da última mensagem basta para conversa 1-para-1
  (decisão 7).
- **Pagamento e aula paga:** a rede é troca entre iguais, sem dinheiro.
- **IA criando habilidades:** poluiria o catálogo e quebraria o match (decisão 3).

## Uma escolha técnica

O índice invertido de `backend/app/core/matches.py` guarda dois mapas habilidade → conjunto de usuários (`sabem` e `querem`) e dois mapas usuário → conjunto de habilidades (`_sei` e `_quero`). Para buscar troca, une os buckets de quem sabe cada habilidade que eu quero e cruza o resultado com a união dos buckets de quem quer cada habilidade que eu sei.

Custos (operações de `dict` e `set` em média/amortizadas):

- **Construção:** O(R), com R registros usuário–habilidade.
- **Salvar habilidades:** O(1) por registro adicionado ou removido, sob a
  tranca da [decisão 29](docs/decisoes/29-indice-com-tranca-e-normalizacao-unica.md).
- **Consulta de troca:** O(h + soma dos buckets das minhas habilidades), com h
  o número de habilidades da pessoa (no máximo 40, `MAX_HABILIDADES` em
  `services/users.py`); as h habilidades são percorridas mesmo quando o bucket
  está vazio. A varredura sem índice olha todos os U usuários e, para cada um,
  cruza até h habilidades: O(U × h).

Com um catálogo fixo e pequeno, cada bucket cresce junto com U, então a
consulta continua linear em U: o índice não muda a classe de complexidade, mas
só visita quem tem alguma habilidade em comum comigo. O ganho cresce quanto
mais espalhadas as habilidades estiverem.

`make bench` gera dados determinísticos (48 habilidades, 1 a 5 "sei" e 1 a 5
"quero aprender" por pessoa), confere que índice e varredura devolvem o mesmo
conjunto de troca antes de medir e mede a construção e a mediana das consultas.
A partir de 1.000 usuários, o índice ficou de 4 a 5× mais rápido que a
varredura; construir para 50 mil usuários levou menos de 0,1 s.

```text
Mede a construção do índice invertido e o tempo de consulta de matches de troca.
A varredura percorre todos os usuários e devolve só as trocas, como o índice; consultas em mediana por pessoa.
  usuários   construção do índice (ms)   consulta índice (µs, mediana)    consulta varredura (µs, mediana)   vezes mais rápido   tamanho médio do resultado de troca
       100                        0.11                            1.21                                4.83                 4.0                                  2.34
     1,000                        0.98                           10.62                               55.52                 5.2                                 29.54
    10,000                       11.60                          100.69                              532.90                 5.3                                297.13
    50,000                       87.70                          834.75                             3402.73                 4.1                               1647.25
Nota: para N=50.000, a mediana usa 20 consultas para manter a execução rápida.
```

O índice fica na memória de um processo (um worker no Render) e é reconstruído no startup a partir do banco. Se o sistema crescesse 100× e tivesse várias instâncias, substituiria essa estrutura por uma consulta SQL com índice por habilidade ou por um cache compartilhado. A outra estrutura em `core/` é a trie do catálogo, descrita na [decisão 14](#14-catálogo-trie-em-memória-autocomplete-e-ia-genérica-com-fallback).

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
- Design e celular (issue #49): Claude Code pesquisou padrões de navegação e
  apresentou três opções por decisão para o dono escolher. Escreveu o contrato
  `casca.ts` e dividiu o restante em cerca de 15 tarefas pequenas para agentes
  do Codex (GPT-6 Luna), em quatro ondas, um dono por arquivo. Claude revisou
  as entregas e corrigiu contraste da sequência, dica fora da tela, clique no
  padding da Folha, contador cortado na curtida e zoom do iOS no toque duplo.
  Testou em 375 px e 1440 px no navegador.
- Rodada da auditoria e da repaginada Colmatch (issues #72 a #86): coordenadores Claude Code dividiram cada issue em tarefas pequenas para agentes do Codex (GPT-6 Luna), revisaram os diffs, rodaram testes, tsc e build e passaram cada PR por um agente revisor antes do merge.
- Documentação e critérios de avaliação (este PR): Claude Code levantou os critérios da RUBRICA.md, agentes do Codex escreveram README, roteiro de avaliação (docs/AVALIACAO.md), o benchmark do índice e a limpeza de backend da issue #77; Claude revisou e corrigiu.
