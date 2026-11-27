# 12. Perfil como currículo de troca

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
