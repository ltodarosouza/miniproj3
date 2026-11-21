# Contrato da API

Sugestão de rotas, campos e status para as ideias do [`CATALOGO.md`](CATALOGO.md).
Não é obrigatório: sigam se ajudar, mudem se o produto de vocês pedir outra
coisa. O núcleo é definido por `backend/tests/test_nucleo.py`.

Convenções:

- 🔒 exige `Authorization: Bearer <token>`;
- página significa `{"items": [...], "total", "offset", "limit"}`;
- datas usam ISO 8601 UTC;
- o que não está aqui é decisão do time.

## Descoberta e conteúdo

### Hashtags com índice invertido

- `GET` 🔒 `/tags/{tag}/posts?offset=&limit=` → `200`, página mais nova primeiro.
- Tag: `[a-z0-9_]+`, casefold e sem duplicar a mesma tag no post.

### Trending de hashtags

- `GET` 🔒 `/tags/trending` → `200`, `{"items": [{"tag": str, "contagem": int}]}`.
- Top 5 das últimas 24 horas; maior contagem primeiro; empate alfabético.
- Usa as tags da feature Hashtags.

### Feed 'Explorar' com filtro

- `GET` 🔒 `/explorar?tag=&offset=&limit=` → `200`, página mais nova primeiro.
- Sem `tag`, mostra posts de todos. Com `tag`, filtra pela tag.

### Busca de usuários por prefixo (busca binária)

- `GET` 🔒 `/busca/usuarios?prefixo=` → `200`, `{"items": [UserOut]}`.
- Máximo 10, ordem alfabética e comparação casefold.

### Busca de posts por palavra

- `GET` 🔒 `/busca/posts?q=&offset=&limit=` → `200`, página mais nova primeiro.
- Termos seguem `[a-z0-9_]+` e casefold. Vários termos usam interseção.

### Enquetes

- `POST` 🔒 `/enquetes`, body `{"pergunta": str, "opcoes": [str]}` → `201`,
  com `id`, `pergunta`, `opcoes` e `total_votos: 0`. Aceita 2 a 4 opções.
- `POST` 🔒 `/enquetes/{id}/votar`, body `{"opcao": int}` → `200`, resultado atualizado.
- `GET` 🔒 `/enquetes/{id}` → `200`,
  `{"pergunta", "opcoes": [{"texto", "votos"}], "total_votos", "ja_votei"}`.
- O índice da opção começa em zero. Segundo voto → `409`; índice inválido → `422`.

### Feed ranqueado 'Em alta'

- `GET` 🔒 `/em-alta?offset=&limit=` → `200`, página por score decrescente.
- Score fixo: `(curtidas + 2 × comentários) / (horas_desde_criação + 2)`.
- Empate: post mais novo primeiro.

### Stories do dia (posts efêmeros)

- `POST` 🔒 `/stories`, body `{"texto": str}` → `201`,
  `{"id", "texto", "autor", "created_at"}`.
- `GET` 🔒 `/stories` → `200`, `{"items": [stories]}`, mais nova primeiro.
- Mostra stories próprios e de quem o usuário segue, criados nas últimas 24 horas.

### Nota/review com estrelas

- `POST` 🔒 `/posts/{post_id}/avaliar`, body `{"estrelas": int}` → `200`,
  `{"media_estrelas": float, "avaliacoes": int}`.
- Aceita 1 a 5. Reavaliar substitui a nota anterior.
- `GET /posts/{id}` ganha `media_estrelas` e `avaliacoes`; média é `null` sem notas.

## Social

### Amigos em comum

- `GET` 🔒 `/usuarios/{username}/amigos-em-comum` → `200`, `{"items": [UserOut]}`.
- Ordem alfabética; interseção entre quem os dois usuários seguem.

### Sugestões de quem seguir

- `GET` 🔒 `/sugestoes` → `200`,
  `{"items": [{"usuario": UserOut, "seguido_por": int}]}`.
- Amigos de amigos, excluindo o próprio usuário e quem ele já segue.
- Máximo 10; maior `seguido_por` primeiro; empate alfabético.

### Menções @username

- `GET` 🔒 `/usuarios/{username}/mencoes?offset=&limit=` → `200`, página mais nova primeiro.
- Menção é `@username` existente. `GET /posts/{id}` ganha `mencoes: [username]`.
- Se Notificações existir, cria evento `mencionou`.

### Bloquear usuário

- `POST` 🔒 `/usuarios/{username}/bloquear` → `204`.
- `DELETE` 🔒 `/usuarios/{username}/bloquear` → `204`.
- `GET` 🔒 `/bloqueados` → `200`, `{"items": [UserOut]}`.
- Bloquear desfaz follows nos dois sentidos.
- O bloqueado recebe `404` no perfil, posts e follow do bloqueador.
- Feeds e buscas não mostram conteúdo bloqueado.

### Conta privada + pedidos de follow

- `PATCH` 🔒 `/usuarios/eu`, body `{"privado": bool}` → `200`, perfil atualizado.
- `POST` 🔒 `/usuarios/{username}/follow` → `202`,
  `{"detail": "pedido enviado"}` para conta privada.
- `GET` 🔒 `/pedidos` → `200`,
  `{"items": [{"id", "de": UserOut, "criado_em"}]}`, em FIFO.
- `POST` 🔒 `/pedidos/{id}/aceitar` → `204`.
- `POST` 🔒 `/pedidos/{id}/recusar` → `204`.
- Conta pública mantém follow imediato. Aceitar um pedido cria o follow.

### Últimos N visitantes do perfil

- `GET` 🔒 `/usuarios/eu/visitantes` → `200`, `{"items": [UserOut]}`.
- Visita é um `GET /usuarios/{username}` autenticado por outra pessoa.
- Dez mais recentes, sem duplicatas consecutivas.

### Comunidades/grupos

- `POST` 🔒 `/grupos`, body `{"nome": str, "descricao": str}` → `201`,
  `{"id", "nome", "descricao", "membros": 1}`; o criador já entra.
- `GET` 🔒 `/grupos?offset=&limit=` → `200`, página com `id`, `nome`,
  `descricao` e `membros`.
- `POST` 🔒 `/grupos/{id}/entrar` → `204`; `DELETE` na mesma rota → `204`.
- `POST` 🔒 `/grupos/{id}/posts`, body `{"texto": str}` → `201`.
- `GET` 🔒 `/grupos/{id}/posts?offset=&limit=` → `200`, página cronológica.
- Nome repetido → `409`; entrar é idempotente; postar sem ser membro → `403`.
- Posts do grupo não entram no feed pessoal.

## Engajamento e sistemas

### Notificações

- `GET` 🔒 `/notificacoes?offset=&limit=` → `200`, página mais recente primeiro.
- Item: `tipo`, `de_username`, `post_id` opcional, `criada_em` e `lida`.
- `GET` 🔒 `/notificacoes/nao-lidas` → `200`, `{"contagem": int}`.
- `POST` 🔒 `/notificacoes/ler` → `204`, marca todas como lidas.
- Tipos: `curtiu`, `comentou`, `seguiu` e `mencionou` quando disponível.
- Ação própria não notifica.

### Streak de atividade

- `GET` 🔒 `/usuarios/{username}` → `200`, perfil com `streak: int`.
- Conta dias consecutivos com post, terminando hoje ou ontem.

### Badges/conquistas

- `GET` 🔒 `/usuarios/{username}/badges` → `200`,
  `{"items": [{"codigo", "nome", "conquistada_em"}]}`.
- Códigos mínimos: `primeiro_post`, `post_popular` (5 curtidas),
  `veterano` (10 posts) e `social` (segue 5 pessoas).
- Concessão automática e sem duplicata.

### Bookmarks (Salvos)

- `POST` 🔒 `/posts/{post_id}/salvar` → `204`.
- `DELETE` 🔒 `/posts/{post_id}/salvar` → `204`.
- `GET` 🔒 `/salvos?offset=&limit=` → `200`, página por salvamento mais recente.
- Salvar é idempotente e a lista é privada.

### Listas/coleções curadas

- `POST` 🔒 `/colecoes`, body `{"nome": str}` → `201`, com `qtd: 0`.
- `POST` 🔒 `/colecoes/{id}/posts`, body `{"post_id": int}` → `204`.
- `DELETE` 🔒 `/colecoes/{id}/posts/{post_id}` → `204`.
- `GET` 🔒 `/colecoes` → `200`, coleções do usuário.
- `GET` 🔒 `/colecoes/{id}` → `200`, posts na ordem de inserção.
- Post repetido não duplica. Leitura pública; escrita de outro usuário → `403`.

### Heatmap de atividade 7×24

- `GET` 🔒 `/usuarios/{username}/atividade` → `200`,
  `{"matriz": [[int × 24] × 7]}`.
- Contagem UTC; `matriz[0]` é segunda-feira.

### Histórico de navegação com 'voltar'

- `POST` 🔒 `/historico`, body `{"tipo": "perfil" | "post", "ref": str}` → `204`.
- `POST` 🔒 `/historico/voltar` → `200`, item removido do topo.
- `GET` 🔒 `/historico` → `200`, topo primeiro.
- Não empilha duplicata consecutiva; voltar vazio → `404`.

### Rate limit de posts

- `POST` 🔒 `/posts` mantém o contrato do núcleo; o sexto post em 60 segundos
  retorna `429`, `{"detail": str}`.
- Limite: cinco posts por usuário.

### Fila de moderação de denúncias

- `POST` 🔒 `/posts/{post_id}/denunciar`, body `{"motivo": str}` → `201`, `{"id": int}`.
- `GET` 🔒 `/moderacao` → `200`,
  `{"items": [{"id", "post_id", "motivo", "de_username", "criada_em"}]}`, em FIFO.
- `POST` 🔒 `/moderacao/{denuncia_id}/resolver`,
  body `{"acao": "remover" | "ignorar"}` → `204`.
- O primeiro usuário registrado é admin. Não-admin → `403`.
- `remover` apaga o post.

### Cache LRU de perfis

- `GET` 🔒 `/cache/stats` → `200`,
  `{"hits": int, "misses": int, "tamanho": int, "capacidade": 50}`.
- `GET /usuarios/{username}` usa o LRU; `PATCH /usuarios/eu` invalida a entrada.
- Dois GETs seguidos do mesmo perfil aumentam `hits`.
- Implementem o LRU, sem `functools.lru_cache`.

## Avançadas

### Graus de separação (BFS no grafo de follows)

- `GET` 🔒 `/usuarios/{username}/distancia` → `200`,
  `{"graus": int | null, "caminho": [username]}`.
- Grafo não-direcionado. Sem conexão: `null` e lista vazia. Eu para eu: zero.
- Benchmark (opcional): BFS contra varredura.

### Top-K com heap

- `GET` 🔒 `/top/semana?k=` → `200`, `{"items": [posts]}`.
- `k` padrão 10 e máximo 50. Considera curtidas dos últimos sete dias.
- Maior número de curtidas primeiro; empate pelo post mais novo.
- Benchmark (opcional): heap contra ordenar tudo.

### Comentários em árvore

- `POST` 🔒 `/posts/{id}/comentarios`,
  body `{"texto": str, "parent_id": int | null}` → `201`.
- `GET` 🔒 `/posts/{id}/comentarios` → `200`,
  `{"items": [comentário com respostas recursivas]}`.
- Parent inexistente ou de outro post → `404`.
- Raízes e filhos em ordem cronológica. Raiz sem parent mantém o teste do núcleo.

### Autocomplete com trie

- `GET` 🔒 `/autocomplete?prefixo=&tipo=` → `200`, `{"sugestoes": [str]}`.
- `tipo`: `usuarios` ou `tags`. Máximo 10, ordem alfabética.
- Trie alimentada no registro e na extração de tags.
- Benchmark (opcional): trie contra bisect.

### DMs 1-para-1

- `POST` 🔒 `/dms/{username}`, body `{"texto": str}` → `201`,
  `{"id", "de_username", "texto", "em"}`.
- `GET` 🔒 `/dms` → `200`,
  `{"items": [{"com": UserOut, "ultima_mensagem": str, "em": str}]}`,
  conversas pela mensagem mais recente.
- `GET` 🔒 `/dms/{username}?offset=&limit=` → `200`, página mais antiga primeiro.
- DM para si mesmo → `422`; entre usuários bloqueados → `404`.
- Benchmark (opcional): estrutura de vocês contra varredura de todas as mensagens.

### Posts com imagem (upload)

- `POST` 🔒 `/posts/{post_id}/imagem`, multipart no campo `arquivo` → `200`,
  `{"imagem_url": str}`.
- Só o autor → `403`. Aceita jpg, png e webp até 2 MB; excesso → `413`.
- `GET /posts/{id}` ganha `imagem_url`, `null` sem imagem.
- Arquivo servido como estático.
