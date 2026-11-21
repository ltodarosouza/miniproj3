# Frentes do time

Quatro frentes, uma por pessoa. Cada dono faz a sua feature de ponta a ponta:
model, service, router, tela e, quando houver, a estrutura em `core/`
(guia 07). Rotas e campos abaixo são o contrato combinado entre as frentes.
Quem mudar um contrato avisa o time e atualiza este arquivo.

Regras para todos:

- uma branch e uma issue por feature; o PR fecha a issue com `Closes #N` e é
  revisado por outra pessoa;
- router fino, regra de negócio no service, estrutura de dados em `core/`;
- nomes em português, iguais em model, schema, rota e tela;
- sem código comentado, sem `print` de debug: explicações vão no markdown;
- cada dono escreve a decisão da sua frente no `DECISIONS.md`.

## Ordem e dependências

1. **Dia 1:** Pessoa A sobe o bypass do guia 01 (Passo 0). Todo mundo já
   desenvolve com o header `X-User-Id` no Swagger.
2. **Dias 1 e 2:** A entrega registro e login. B entrega `POST /posts` e
   `GET /posts/{id}`. A e C combinam o formato de `GET /usuarios/{username}`.
3. **Até 24/11:** núcleo inteiro com `make test` verde e primeiro deploy (D).
4. **25 e 26/11:** diferenciais (habilidades, match, chat, agendamento,
   avaliação), seed com a cara da rede, vídeo e pitch.
5. **27/11:** entrega. Extras só se tudo acima estiver pronto.

| Quem precisa | De quê | De quem |
|---|---|---|
| Todos | registro, login, `get_current_user` | A |
| C (match) | tabela `user_habilidades` | A |
| B (feed misto) | `matches.quem_pode_ensinar(usuario_id)` | C |
| D (chat) | `matches` para mostrar o botão "Conversar" | C |
| A (perfil) | `seguidores`, `seguindo` | C |
| A (perfil) | `streak` | B |
| A (perfil) | `media_professor`, `avaliacoes` | D |
| C (seed) | models de todas as frentes | A, B, D |

---

## Pessoa A: Auth, perfil e habilidades

**Área de revisão:** frontend (layout, navegação, `frontend/lib/api.ts`).

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

## Pessoa B: Posts de rotina, feed e streak

**Área de revisão:** backend (models, routers, services, `main.py`).

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

## Pessoa C: Follow, match e seed

**Área de revisão:** dados (seed e `core/`).

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

## Pessoa D: Chat, agendamento, avaliação e deploy

**Área de revisão:** reforça backend e cuida do deploy.

### Backend

- Model `Mensagem`: `de_id`, `para_id`, `texto`, `em`.
  - `POST /dms/{username}` → `201`; mensagem para si mesmo → `422`;
  - `GET /dms` → conversas, pela mensagem mais recente;
  - `GET /dms/{username}?depois_de=` → mensagens mais antigas primeiro; o
    parâmetro permite que o polling busque só as novas.
- Model `Troca`: `proposta_por_id`, `com_id`, `data_hora`, `link_meet`,
  `habilidade_ensino_id`, `habilidade_aprendo_id` (opcional), `status`:
  `proposta`, `confirmada`, `recusada`.
  - `POST /trocas` → `201`; `POST /trocas/{id}/confirmar` e `/recusar`, só
    por quem recebeu;
  - `GET /trocas` → minhas trocas, próximas primeiro.
- Model `Avaliacao`: `troca_id`, `de_id`, `para_id`, `estrelas` (1 a 5),
  `feedback`.
  - `GET /trocas/pendentes-avaliacao` → trocas confirmadas cujo horário já
    passou e que eu ainda não avaliei;
  - `POST /trocas/{id}/avaliar` → `201`; antes do horário → `409`; segunda
    avaliação → `409`; quem não participou → `403`;
  - média e total por usuário para o perfil de A.
- Link do Google Agenda gerado no service a partir da troca:
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...`.

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
