# 31. Erro honesto em post apagado, limite de 5 posts por minuto e validação única de upload

- **Contexto:** issue #76, achados F8, F15 e F16 da auditoria. Três problemas
  na área de posts: (1) curtir ou comentar um post apagado entre a checagem e
  a gravação dava sucesso falso (no Postgres, o `except` largo da curtida
  respondia 204 sem gravar) ou erro 500 (comentário); (2) o limite de posts
  do `CONTRATO.md` (6º post em 60 s recebe 429) não existia: o limitador de
  `core/limite.py` só protegia o mapeamento de IA; (3) a validação de upload
  estava copiada entre `services/imagens.py` e `services/avatares.py`, e os
  dois `servir` diferiam (`match` num, `fullmatch` no outro).
- **Opções:** ligar `PRAGMA foreign_keys=ON` no SQLite para o erro aparecer
  também no dev; ou tratar o `IntegrityError` no serviço e conferir se o post
  ainda existe. Para o limite, um limitador novo ou reaproveitar o de IA.
- **Escolha:** no `IntegrityError` de curtida e comentário, depois do
  rollback, se o post não existe mais a API responde 404 "post não existe
  mais"; curtida repetida continua 204 e outros erros do comentário seguem
  como antes. `limitador_posts = LimitadorDeTaxa(5, 60)` em `core/limite.py`,
  usado em `POST /posts`: o 6º post de uma pessoa em 60 s recebe 429 com
  mensagem em português, que o formulário de novo post já mostra.
  `imagens.ler_e_validar(arquivo)` é o único lugar que decide o que é um
  upload válido (leitura limitada, 413, detecção pelo Pillow, 422), usado por
  post e avatar; os dois `servir` usam `fullmatch`. O extra do contrato foi
  entregue: 5 posts por minuto barra scripts sem atrapalhar o uso normal.
- **O que cortamos e por quê:** `PRAGMA foreign_keys=ON` no SQLite exigiria
  revisar a suíte inteira; os testes simulam a falha de chave estrangeira com
  `simular_post_apagado_antes_do_commit` no `conftest.py`. O limitador vive em
  memória, por processo: basta para um serviço único no Render.