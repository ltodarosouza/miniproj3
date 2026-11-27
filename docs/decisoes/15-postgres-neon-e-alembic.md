# 15. Banco de produção no Postgres do Neon, com migrações Alembic

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
