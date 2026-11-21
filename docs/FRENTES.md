# Frentes do time

Quatro frentes, uma por pessoa. Cada dono faz a sua feature de ponta a ponta:
model, service, router, tela e, quando houver, a estrutura em `core/`
(guia 07). Rotas e campos abaixo são o contrato combinado entre as frentes.
Quem mudar um contrato avisa o time e atualiza este arquivo.

| Frente | Dono |
|---|---|
| A: Auth, perfil e habilidades | @italoosilva |
| B: Posts de rotina, feed e streak | @NicoleAlverga |
| C: Follow, match e seed | _a definir_ |
| D: Chat, agendamento, avaliação e deploy | @ltodarosouza |

Regras para todos:

- uma branch e uma issue por feature; o PR fecha a issue com `Closes #N` e é
  revisado por outra pessoa;
- router fino, regra de negócio no service, estrutura de dados em `core/`;
- nomes em português, iguais em model, schema, rota e tela;
- sem código comentado, sem `print` de debug: explicações vão no markdown;
- toda tela usa os componentes de `frontend/components/ui/` e segue o
  [DESIGN.md](../DESIGN.md); componente novo que sirva para mais de uma tela
  entra lá e na página `/design`;
- cada dono escreve a decisão da sua frente no `DECISIONS.md`;
- **ao terminar uma tarefa, limpar e fechar tudo** (checklist abaixo). Vale
  para pessoas e para agentes de IA.

## Ao terminar uma tarefa: limpar e fechar tudo

Toda tarefa só está terminada depois desta limpeza. Worktree, branch ou
servidor esquecido confunde o time e os agentes na tarefa seguinte.

1. **PR mesclado e issue fechada.** O PR fecha a issue com `Closes #N`. Se a
   issue não fechou sozinha, feche à mão. PR que não vai mais ser usado:
   feche também.
2. **Apagar os worktrees** que não serão mais usados:
   ```bash
   git worktree list
   git worktree remove ../nome-do-worktree
   git worktree prune
   ```
3. **Apagar as branches** já mescladas ou abandonadas, local e no GitHub:
   ```bash
   git switch main && git pull
   git branch -d nome-da-branch
   git push origin --delete nome-da-branch
   git fetch --prune
   ```
   Use `git branch -D` só para branch abandonada que nunca vai ser mesclada.
4. **Fechar o que ficou rodando:** servidores (`make dev-back`,
   `make dev-front`), terminais em background, subagentes e processos de
   teste. Confira com `lsof -i :3000` e `lsof -i :8000`.
5. **Conferir:** `git worktree list` mostra só a pasta principal,
   `git branch` mostra só `main` e as branches em uso, e `git status` está
   limpo.

## Trabalho em paralelo

As quatro frentes andam em paralelo quase o tempo todo. Só três coisas não
são paralelas: a **Fase 0** (curta, no começo), os **pontos de encaixe**
(quando a peça real de um substitui o provisório no código do outro) e o
**seed** (no fim). Tudo o que não está nesta seção pode ser feito sem esperar
ninguém.

### Fase 0: bloqueante (primeiras horas do dia 1)

Ninguém começa a própria feature antes destes três PRs estarem na `main`.
Para não atrasar ninguém, **@ltodarosouza assumiu a Fase 0 inteira** (0.1, 0.2
e 0.3), e ela sai num só dia:

| # | PR | Dono | O que entra | Por que bloqueia |
|---|---|---|---|---|
| 0.1 | Bypass de auth | ✅ pronto | `get_current_user` lendo o header `X-User-Id` (guia 01, Passo 0) | Toda rota protegida depende dele |
| 0.2 | Models de habilidade | ✅ pronto | `Habilidade` e `UserHabilidade`, sem rotas, e o catálogo no seed | C monta o match em cima dessas tabelas |
| 0.3 | Esqueleto do match | ✅ pronto | `core/matches.py` com `quem_pode_ensinar(eu)` devolvendo `set()` e o singleton registrado no lifespan | B chama essa função no feed |
| 0.4 | Design system | ✅ pronto | Tokens, componentes em `frontend/components/ui/`, movimento e a página `/design` ([DESIGN.md](../DESIGN.md)) | Todas as telas usam as mesmas peças |

Enquanto a Fase 0 não termina, os outros fazem o `make check`, leem os guias e
desenham as telas, sem escrever rotas.

### Fase 1: paralelo de verdade (do fim do dia 1 até 26/11)

Cada frente trabalha nos próprios arquivos. Para não esperar o colega, cada
pessoa usa um **provisório** no lugar do que vem de outra frente:

| Quem usa | O quê | De quem | Provisório até ficar pronto |
|---|---|---|---|
| B, C e D | Login de verdade | A | Header `X-User-Id` no Swagger |
| B (feed misto) | `matches.quem_pode_ensinar(eu)` | C | Esqueleto da Fase 0, que devolve vazio: o feed mostra só os seguidos |
| A (perfil) | `seguidores`, `seguindo` | C | Valor `0` |
| A (perfil) | `streak` | B | Valor `0` |
| A (perfil) | `media_professor`, `avaliacoes` | D | `null` e `0` |
| B (form de post) | Autocomplete de habilidades | A | Um `<select>` com as habilidades do catálogo |
| C e D (telas) | Navegação e `api.ts` com token | A | Página solta, acessada pela URL |
| D (telas do chat) | Saber quem está logado | A | `localStorage.usuario_id` vira o header `X-User-Id` em `lib/api.ts`, e `lib/sessao.ts` (`meuId()`) devolve esse id. No encaixe do login, A troca as duas funções pelo token |
| D (botão "Conversar") | Tela de matches | C | Abrir a conversa digitando a URL `/mensagens/[username]` |

Regra de ouro: o provisório entra no código com o **mesmo nome e o mesmo
formato** do contrato deste arquivo. Assim, o encaixe muda só uma linha.

### Pontos de encaixe

Quando a peça real fica pronta, o dono dela avisa no grupo e quem usava o
provisório troca. É uma mudança pequena, mas precisa acontecer na ordem:

| Encaixe | Acontece quando | Quem troca |
|---|---|---|
| Login real no lugar do header | A termina registro e login (dia 1 ou 2) | Cada um testa de novo a própria tela com login |
| Contadores, streak e média no perfil | C, B e D terminam suas funções | A liga no `GET /usuarios/{username}` |
| Feed misto acende | C implementa o índice de verdade | Ninguém: a função já é chamada, só passa a devolver usuários |
| Autocomplete no form de post | A termina a trie | B troca o `<select>` pelo componente de A |
| Botão "Conversar" | C termina a tela de matches e D, o chat | C aponta o botão para a rota de D |

### O que não pode ser paralelo

- **Fase 0:** tem que vir antes de tudo.
- **Seed (C):** depende dos models de todas as frentes. C começa por follow e
  match e só escreve o `seed_fake` quando `Post`, `Mensagem`, `Troca` e
  `Avaliacao` estiverem na `main` (meta: 25/11).
- **Teste ponta a ponta e vídeo:** só com tudo integrado (26/11).
- **Deploy final (D):** o primeiro deploy sai cedo, mas o último é depois do
  seed.

### Para não dar conflito

- Cada pessoa mexe só nos arquivos da sua frente: `models/`, `schemas/`,
  `services/`, `routers/` e páginas com o nome da feature.
- Arquivos compartilhados mudam pouco e com cuidado: `main.py` (uma linha por
  router), `frontend/lib/api.ts` (uma função por rota) e `scripts/seed.py`
  (só C). Conflito nesses arquivos se resolve mantendo as linhas dos dois
  lados (guia 02).
- Façam `git pull` da `main` todo dia antes de começar.

### Cronograma

| Data | Marco |
|---|---|
| 21/11 (dia 1) | Fase 0 na `main`; todos começam a Fase 1 |
| 22/11 | Login real (A); `POST /posts` e `GET /posts/{id}` (B); primeiro deploy (D) |
| 24/11 | Núcleo inteiro com `make test` verde |
| 25/11 | Diferenciais prontos; todos os models na `main`; C fecha o seed |
| 26/11 | Integração, teste na URL pública, vídeo e pitch |
| 27/11 | Entrega. Extras só se tudo acima estiver pronto |

---

## Pessoa A (@italoosilva): Auth, perfil e habilidades

**Área de revisão:** frontend (layout, navegação, `frontend/lib/api.ts`).

| Paralelismo | |
|---|---|
| Fase 0 | Feita por @ltodarosouza: A começa direto pelo login real em cima do bypass e dos models prontos |
| Entrega cedo para os outros | Login real (dia 2), navegação e `api.ts` com token |
| Começa já, sem esperar ninguém | Auth, catálogo, trie, IA, telas de cadastro, login e edição de perfil |
| Depende de outros | Contadores (C), streak (B) e média (D) no perfil: usa `0`/`null` até lá |

### Backend

- Auth (guia 01): `POST /auth/registro` → `201`, `409` se o username já
  existe; `POST /auth/login` → `200` com `token`, `401` com senha errada;
  `GET /auth/eu` → `200`, `401` sem token. Senha com hash.
- Perfil: `PATCH /usuarios/eu` (`bio`, `avatar_url`);
  `GET /usuarios/{username}` devolve `bio`, `avatar_url`, `seguidores`,
  `seguindo`, `streak`, `media_professor`, `avaliacoes` e as habilidades;
  `GET /usuarios/{username}/posts` paginado.
- Catálogo de habilidades:
  - model `Habilidade` (`id`, `nome`, `categoria`: `tech` ou `disciplina`),
    preenchido no seed com uns 40 itens (Python, JavaScript, React, Git, SQL,
    Docker, Cálculo 1, Estrutura de Dados...);
  - model `UserHabilidade` (`usuario_id`, `habilidade_id`, `tipo`: `sei` ou
    `quero_aprender`, `nivel` de 1 a 5);
  - `GET /habilidades/autocomplete?prefixo=` → até 10 nomes em ordem
    alfabética, usando a trie;
  - `POST /habilidades/mapear` com `{"texto": str}` →
    `{"habilidade": {...} | null}`;
  - `PUT /usuarios/eu/habilidades` com a lista completa de
    `{habilidade_id, tipo, nivel}`; atualiza o índice do match de C.
- `core/catalogo.py`: trie de nomes de habilidades, casefold, reconstruída no
  lifespan.
- Mapeamento por IA: um service chama um modelo barato com a lista do
  catálogo e o texto digitado e aceita só uma resposta que exista no
  catálogo. Se a chave da API não existir ou a chamada falhar, usa
  `difflib.get_close_matches`. A chave fica em variável de ambiente, nunca no
  repositório.

### Frontend

- `/cadastro`, `/login`, token guardado e enviado em `api.ts`, logout.
- `/perfil/[username]`: bio, avatar, contadores, streak, nota como professor,
  listas "Sei" e "Quero aprender" com nível, posts.
- `/perfil/editar`: bio, avatar e o editor de habilidades com autocomplete,
  campo livre com "Você quis dizer...?" e seletor de nível.
- Barra de navegação: Feed, Matches, Mensagens, Perfil.

### Pronto quando

- `test_auth_registro`, `test_auth_login`, `test_auth_eu` e
  `test_perfil_editavel` passam;
- digitar "pyton" sugere "Python" e digitar algo fora do catálogo pede para
  escolher da lista.

---

## Pessoa B (@NicoleAlverga): Posts de rotina, feed e streak

**Área de revisão:** backend (models, routers, services, `main.py`).

| Paralelismo | |
|---|---|
| Fase 0 | Espera 0.1 e 0.3 |
| Entrega cedo para os outros | `POST /posts` e `GET /posts/{id}` (dia 2), que destravam vários testes; model `Post` para o seed de C; função de streak para o perfil de A |
| Começa já, sem esperar ninguém | Posts, curtidas, comentários, upload, streak, feed dos seguidos, telas |
| Depende de outros | Feed misto acende quando C termina o índice; autocomplete de A no form (usa `<select>` até lá) |

### Backend

- Model `Post`: `texto`, `autor_id`, `habilidade_id` (opcional),
  `minutos_estudados` (opcional), `imagem_url` (opcional), `created_at`.
  Tabela `posts`.
- CRUD: `POST /posts` → `201`; `GET /posts/{id}` com `curtidas`;
  `PATCH /posts/{id}`; `DELETE /posts/{id}` → `204`, `403` para quem não é o
  autor.
- Curtidas: `POST` e `DELETE /posts/{id}/curtir`, idempotentes. Tabela
  `likes`.
- Comentários planos: `POST` e `GET /posts/{id}/comentarios`, ordem
  cronológica.
- Upload de foto (guia 06): `POST /posts/{id}/imagem`, campo `arquivo`, jpg,
  png ou webp até 2 MB; `413` acima disso, `403` se não for o autor.
- Feed: `GET /feed?offset=&limit=`, mais novo primeiro, com posts de quem eu
  sigo mais posts de quem pode me ensinar (usa
  `matches.quem_pode_ensinar` de C). Cada item vem com
  `motivo`: `seguindo` ou `pode_te_ensinar`. Sem habilidades cadastradas, o
  feed é só dos seguidos, e o teste do núcleo continua passando.
- Streak: dias seguidos com post, terminando hoje ou ontem, em UTC. Uma
  função no service que A usa no perfil.

### Frontend

- `/feed`: lista paginada com "carregar mais", selo "Pode te ensinar" nos
  posts de quem não sigo.
- Formulário de novo post: texto, habilidade (autocomplete de A), tempo
  estudado e foto.
- Card de post: autor, habilidade, "2h de React", foto, curtir, comentários.
- `/posts/[id]` com os comentários.

### Pronto quando

- `test_posts_crud`, `test_feed_cronologico_dos_seguidos`,
  `test_curtidas_idempotentes` e `test_comentarios_planos_cronologicos`
  passam;
- um post com foto aparece no feed de quem me segue e de quem quer aprender a
  habilidade do post.

---

## Pessoa C (a definir): Follow, match e seed

**Área de revisão:** dados (seed e `core/`).

| Paralelismo | |
|---|---|
| Fase 0 | Feita por @ltodarosouza: C começa direto pelo follow e pelo índice do match em cima do esqueleto pronto |
| Entrega cedo para os outros | Contadores de seguidores/seguindo para o perfil de A |
| Começa já, sem esperar ninguém | Follow, índice do match, `GET /matches`, tela de matches, bench |
| Depende de outros | Seed: só quando todos os models estiverem na `main` (meta 25/11); botão "Conversar" aponta para o chat de D |

### Backend

- Model `Follow` (tabela `follows`): `POST` e
  `DELETE /usuarios/{username}/follow`, idempotentes;
  `GET /usuarios/{username}/seguidores` e `/seguindo`; contadores para o
  perfil de A.
- `core/matches.py`, no padrão de `core/contadores.py`:
  - `sabem: dict[habilidade_id, set[usuario_id]]` e
    `querem: dict[habilidade_id, set[usuario_id]]`;
  - `pode_me_ensinar(eu)`: união de `sabem[h]` para cada `h` que eu quero;
  - `match_de_troca(eu)`: quem pode me ensinar e também quer algo que eu sei;
  - `quem_pode_ensinar(eu)` exposto para o feed de B;
  - reconstruído no lifespan e atualizado a cada `PUT /usuarios/eu/habilidades`.
- `GET /matches` →
  `{"troca": [...], "pode_te_ensinar": [...]}`. Cada item traz o usuário, o
  que ele pode me ensinar (com nível) e, na troca, o que eu posso ensinar a
  ele. Troca primeiro; dentro de cada grupo, mais habilidades em comum
  primeiro, empate alfabético.
- Seed `seed_fake(db)` em `scripts/seed.py`: pelo menos 30 usuários
  iniciantes com habilidades cruzadas de propósito (vários pares de troca),
  50+ posts de rotina com habilidade e tempo, 20+ follows, 30+ curtidas,
  algumas conversas e trocas já avaliadas (com D).
- Opcional: `scripts/bench_matches.py` comparando o índice com varrer todos
  os usuários, para "Uma escolha técnica".

### Frontend

- Botão seguir/deixar de seguir no perfil e listas de seguidores/seguindo.
- `/matches`: seção "Match de troca" em destaque ("Ele te ensina React, você
  ensina Python") e seção "Pode te ensinar", com nível e botão "Conversar"
  (abre o chat de D).

### Pronto quando

- `test_follow_unfollow_com_contadores` e `test_seed_fake_popula_a_rede`
  passam;
- depois do `make seed`, qualquer usuário do seed vê pelo menos um match de
  troca.

---

## Pessoa D (@ltodarosouza): Chat, agendamento, avaliação e deploy

**Área de revisão:** reforça backend e cuida do deploy.

| Paralelismo | |
|---|---|
| Fase 0 | Faz 0.1, 0.2 e 0.3 para destravar o time; depois segue a própria frente |
| Entrega cedo para os outros | Primeiro deploy (dia 2); models `Mensagem`, `Troca` e `Avaliacao` para o seed de C; média e total para o perfil de A |
| Começa já, sem esperar ninguém | Chat, agendamento, avaliação, link do Google Agenda, telas, deploy |
| Depende de outros | Deploy final: depois do seed de C |

### Backend

- Model `Mensagem`: `de_id`, `para_id`, `texto` (1 a 1000 caracteres), `em`.
  - `POST /dms/{username}` com `{"texto"}` → `201`,
    `{"id", "de_username", "para_username", "texto", "em"}`; para si mesmo →
    `422`; username inexistente → `404`;
  - `GET /dms` → `{"items": [{"com": UserOut, "ultima_mensagem",
    "ultima_de_mim", "em"}]}`, pela mensagem mais recente;
  - `GET /dms/{username}?depois_de=&limit=` → `{"items": [...]}`, mais
    antigas primeiro. `depois_de` é o **id** da última mensagem que a tela já
    tem (o polling busca só as novas); sem ele, vêm as `limit` (50) mais
    recentes.
- Model `Troca`: `proposta_por_id`, `com_id`, `data_hora`, `link_meet`,
  `habilidade_ensino_id`, `habilidade_aprendo_id`, `status`: `proposta`,
  `confirmada`, `recusada`. As duas habilidades são do ponto de vista de quem
  propôs (o que ele ensina e o que ele aprende) e ambas são opcionais, mas
  pelo menos uma é obrigatória: as duas juntas são um match de troca; só
  `aprendo` é o caso "pode te ensinar".
  - `POST /trocas` com `{"com_username", "data_hora", "link_meet",
    "habilidade_ensino_id", "habilidade_aprendo_id"}` → `201`; horário no
    passado → `422`;
  - `POST /trocas/{id}/confirmar` e `/recusar`, só por quem recebeu (`403`
    para quem propôs, `409` se já foi respondida);
  - `GET /trocas?com=` → minhas trocas (ou só as com uma pessoa), futuras
    primeiro e da mais próxima para a mais distante, depois as passadas;
  - cada troca vem com `link_google_agenda` pronto.
- Model `Avaliacao`: `troca_id`, `de_id`, `para_id`, `estrelas` (1 a 5),
  `feedback` (até 500).
  - `GET /trocas/pendentes-avaliacao` → trocas confirmadas cujo horário já
    passou e que eu ainda não avaliei;
  - `POST /trocas/{id}/avaliar` → `201`; antes do horário → `409`; segunda
    avaliação → `409`; quem não participou → `403`;
  - `GET /usuarios/{username}/avaliacoes` → `{"media", "total", "items"}`
    com as avaliações recebidas;
  - `services/avaliacoes.media_e_total(db, usuario_id)` para o perfil de A.
- Link do Google Agenda gerado no service a partir da troca:
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...`.
- Datas da frente D são guardadas em UTC e saem da API com `Z` no fim
  (`schemas/tempo.py`). O frontend formata no fuso do navegador
  (`lib/datas.ts`).
- `GET /habilidades` → catálogo completo (`{"items": [{id, nome,
  categoria}]}`), usado no formulário de agendamento. A pode estender este
  router com o autocomplete.

### Frontend

- `/mensagens`: lista de conversas.
- `/mensagens/[username]`: conversa com polling a cada 3 segundos e botão
  "Agendar troca" (data, hora, link do Meet, habilidades).
- Card da troca dentro da conversa: confirmar ou recusar e "Adicionar ao
  Google Agenda".
- Aviso de avaliação pendente (estrelas e campo de feedback) ao abrir o app.

### Deploy

- Seguir o guia 08 assim que auth e posts funcionarem, e reimplantar a cada
  feature que entrar na `main`.
- Configurar CORS e as variáveis de ambiente (URL da API, chave da IA).
- Antes da entrega, testar na URL: cadastro → login → post → follow → feed →
  match → chat → agendar → avaliar.

### Pronto quando

- duas contas conversam, agendam, confirmam e, passado o horário, avaliam uma
  à outra;
- a média aparece no perfil;
- a rede funciona na URL pública.

---

## Extras (só com tudo acima pronto)

| Extra | Sugestão de dono |
|---|---|
| Notificações (match, mensagem, troca, avaliação, seguidor) | D |
| Trending de habilidades da semana | B |
| Badges (primeira troca, 7 dias de streak, professor 5 estrelas) | C |
