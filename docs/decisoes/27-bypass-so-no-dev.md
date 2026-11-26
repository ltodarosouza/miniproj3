# 27. Bypass `X-User-Id` só no dev: produção recusa o boot com DEBUG

- **Contexto:** issue #72, achado F4 da auditoria. O header `X-User-Id` com
  `DEBUG=true` nasceu na Fase 0 para testar rotas antes da auth existir, e a
  decisão 10 o manteve para o dev (fixtures do `conftest.py` e fallback do
  `lib/api.ts`). A única proteção em produção era a frase "nunca liguem DEBUG"
  em `docs/guias/08-deploy.md`. Se alguém ligasse `DEBUG=true` no painel do
  Render, ou commitasse um `.env` com isso (o `main.py` carrega `.env` no boot),
  qualquer pessoa na URL pública viraria qualquer usuário com um header. A
  auditoria reproduziu: com `DEBUG=true`, `GET /auth/eu` só com `X-User-Id: 1`
  respondeu 200.
- **Opções:** apagar o bypass e reescrever os fixtures dos testes; ignorar o
  header fora do SQLite sem avisar; recusar o boot quando `DEBUG=true` aparece
  fora do dev local.
- **Escolha:** recusar o boot. `recusar_debug_fora_do_dev()` é a primeira linha
  do `lifespan` em `backend/app/main.py`: se `DEBUG == "true"` e a variável
  `RENDER` estiver definida (o Render define em todo serviço) ou o banco não for
  SQLite, levanta `RuntimeError("DEBUG=true proibido fora do dev local")`. O
  deploy falha na hora, com a causa no log, em vez de subir aberto. No dev local
  (SQLite, sem `RENDER`) e nos testes nada muda. Testes em
  `backend/tests/test_deploy.py`: Render + DEBUG recusa, Postgres + DEBUG
  recusa, dev local + DEBUG sobe.
- **O que cortamos e por quê:** apagar o bypass obrigaria a reescrever os
  fixtures de toda a suíte sem ganho de segurança, já que a produção agora não
  sobe com ele. Ignorar o header em silêncio esconderia a configuração errada;
  falhar no boot deixa o erro visível.