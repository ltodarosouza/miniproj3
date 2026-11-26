# 41. Feed com mais imagem

Pedido direto do dono, sem issue.

- **Contexto.** O feed parecia só texto. As fotos devem ajudar a reconhecer o
  tema de estudo sem esconder as frases de rotina.
- **Opções.** Aumentar a fração sorteada de fotos, o que não garante o ritmo no
  feed; colocar foto em todo post, o que vira vitrine e esconde o diário de
  rotina; alternar exatamente um post sem foto e um com foto.
- **Escolha.** Alternância exata 1:1 em ordem cronológica: 56 posts, 28 com
  foto e 28 sem. O seed mantém oito pessoas constantes postando por quatro
  dias seguidos, incluindo hoje, e as outras 24 postando uma vez nos últimos
  sete dias. Os textos têm até 90 caracteres: legendas próprias acompanham
  fotos, e posts sem foto usam frases de rotina. As fotos do Unsplash seguem o
  tema da habilidade, com rodízio por tema e sem repetir a mesma foto em posts
  seguidos. As 38 URLs foram validadas em 2026-11-26 (HTTP 200 e folha de
  contato).
- **O que cortamos e por quê.** Os 10 posts de progresso e o sorteio de 45%
  de fotos: não garantem um ritmo visual consistente. Não usamos `pg_dump`,
  pois não há cliente Postgres nesta máquina; o backup JSON cobre as tabelas
  tocadas e pode ser restaurado com `--restaurar`. Também não criamos posts
  novos para usuários reais.
- **Produção.** `backend/scripts/refazer_posts.py` identifica usuários falsos
  pela senha `SENHA_SEED` somada ao username ou à bio do seed (a produção foi
  semeada por uma versão antiga do seed, com outros usernames; bio vazia nunca
  conta). Sem `--aplicar`,
  mostra o plano sem gravar. O escopo padrão `bots` apaga posts só desses
  usuários; `--escopo todos` apaga posts de todos, mas novos posts são sempre
  criados apenas para usuários falsos. Com `--aplicar`, grava um backup JSON
  com as linhas de `posts`, `likes`, `comentarios`, `imagens_post` e
  `notificacoes_entregues` a apagar, e então apaga e repõe tudo numa transação.
  Curtidas e comentários são criados entre usuários falsos. `--restaurar`
  apaga os posts atuais dos autores do backup e devolve as linhas originais
  com os mesmos ids. O backup padrão é
  `backup-posts-AAAAMMDD-HHMMSS.json`; `--backup` define outro caminho.
  `--listar-reais` lista os posts de gente real (id, autor, data, foto, começo
  do texto) e `--posts-reais 107,109` apaga também esses posts reais escolhidos
  por id, que entram no backup e voltam com `--restaurar`; os autores reais não
  ganham posts novos.
  Antes de aplicar, recomenda-se criar também um branch do banco no painel do
  Neon.

  ```bash
  cd backend
  DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py
  DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py --aplicar
  DATABASE_URL='<url do Neon>' uv run python scripts/refazer_posts.py --restaurar backup-posts-AAAAMMDD-HHMMSS.json --aplicar
  ```

  Da raiz: `make refazer-posts args="--aplicar"`.
