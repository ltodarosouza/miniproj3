# Catálogo de features

Este catálogo é um cardápio de ideias de features. Não vale nota por feature:
cada time escolhe as que fazem sentido para o seu nicho, ou inventa outras, e
a banca avalia o produto inteiro (veja a [`RUBRICA.md`](RUBRICA.md)). Para as
ideias daqui, o [`CONTRATO.md`](CONTRATO.md) traz uma sugestão de rotas e campos
que vocês podem seguir ou mudar.

Esforço: P = pequeno, M = médio, G = grande.

## Núcleo

Os testes do núcleo estão em `backend/tests/test_nucleo.py`, marcados com `@skip`
até o time implementar. Eles são um roteiro, não valem nota.

| Feature | Esforço | Descrição |
|---|---|---|
| Cadastro e login com hash de senha | M | Registro, login e autenticação por token. |
| Posts de texto (CRUD) | P | Criar, listar, editar e apagar posts. |
| Feed cronológico paginado | M | Posts mais novos primeiro, com offset e limit. |
| Perfil de usuário (avatar, bio) | M | Perfil editável com posts do usuário. |
| Seguir/seguidores | M | Follow, unfollow, listas e contadores. |
| Curtidas | P | Like e unlike idempotentes. |
| Comentários (lista plana) | M | Comentários em ordem cronológica. |
| Seed de dados fake | P | Usuários, posts, follows e likes para a demo. |

## Ideias de features

| Feature | Esforço | Descrição |
|---|---|---|
| Trending de hashtags | P | Top 5 tags das últimas 24 horas. |
| Feed 'Explorar' com filtro | P | Posts de todos, com filtro opcional. |
| Bookmarks (Salvos) | P | Salvar e remover posts numa lista privada. |
| Últimos N visitantes do perfil | P | Dez visitas mais recentes, sem repetição consecutiva. |
| Amigos em comum | P | Pessoas seguidas pelos dois usuários. |
| Streak de atividade | P | Dias consecutivos com posts. |
| Histórico de navegação com 'voltar' | P | Histórico de perfis e posts visitados. |
| Rate limit de posts | P | Limite por janela de tempo. |
| Hashtags com índice invertido | M | Índice tag para posts. |
| Notificações | M | Eventos sociais e contador de não lidas. |
| Busca de usuários por prefixo (busca binária) | M | Autocomplete de usernames. |
| Sugestões de quem seguir | M | Amigos de amigos ordenados por conexões. |
| Enquetes | M | Enquetes com um voto por usuário. |
| Feed ranqueado 'Em alta' | M | Posts ordenados por engajamento e idade. |
| Stories do dia (posts efêmeros) | M | Posts que expiram após 24 horas. |
| Nota/review com estrelas | M | Avaliação de 1 a 5 estrelas. |
| Menções @username | M | Detectar, linkar e notificar menções. |
| Busca de posts por palavra | M | Busca por interseção de termos. |
| Fila de moderação de denúncias | M | Denúncias processadas em FIFO. |
| Conta privada + pedidos de follow | M | Aceitar ou recusar solicitações. |
| Bloquear usuário | M | Remover relações e ocultar conteúdo. |
| Badges/conquistas | M | Conquistas sem duplicatas. |
| Listas/coleções curadas | M | Coleções públicas de posts. |
| Heatmap de atividade 7×24 | M | Posts agrupados por dia e hora. |
| Cache LRU de perfis | M | Cache com hits, misses e despejos. |
| Comunidades/grupos | G | Grupos com membros e feed próprio. |

## Ideias com estrutura de dados

Quem quiser ir mais fundo pode medir a estrutura contra a versão simples
(`scripts/bench_<feature>.py`, rodando com `make bench`) e contar o resultado no
`DECISIONS.md`. É opcional. Upload não precisa de `core/` nem de benchmark. Em
DMs, a comparação é o dict de conversas contra uma varredura linear das
mensagens.

| Feature | Estrutura de dados | Esforço | Descrição |
|---|---|---|---|
| Posts com imagem (upload) | tecnologia extra | M | Upload local de jpg, png ou webp. |
| Graus de separação (BFS no grafo de follows) | grafo + BFS | M | Distância e caminho entre usuários. |
| Top-K com heap | heap | M | Posts mais curtidos da semana. |
| Comentários em árvore | árvore + recursão | G | Respostas aninhadas. |
| DMs 1-para-1 | dict de conversas + fila | G | Mensagens privadas por conversa. |
| Autocomplete com trie | trie | G | Sugestões de tags ou usernames por prefixo. |
