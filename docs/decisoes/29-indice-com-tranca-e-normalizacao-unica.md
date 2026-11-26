# 29. Índice com tranca e normalização única

- **Contexto:** issue #73, auditoria F5, F11, F14 e parte de F10. Em
  `salvar_habilidades` (`backend/app/services/users.py`), o banco era gravado
  antes de ajustar o índice de matches em memória, sem tranca. Dois `PUT
  /usuarios/eu/habilidades` simultâneos (duplo clique em "Salvar") deixavam o
  banco certo e o índice sem uma habilidade; a pessoa sumia do match de
  terceiros até o servidor reiniciar. `GET /usuarios?q=` filtrava com
  `lower()` do banco e não ignorava acento, contrariando a decisão 19: "isis"
  não achava "Ísis Borges", e 11 dos 32 nomes do seed têm acento.
  `services/matches.py` tinha `_chave_alfabetica`, cópia literal de
  `normalizar` de `core/catalogo.py`. A busca de pessoa pelo username da URL
  estava copiada em 9 lugares do backend, sem `lower()`: `GET /dms/Ana` dava
  404 enquanto o login como "Ana" funcionava.
- **Opções:** para o índice, trancar a escrita; reconstruir o índice da pessoa
  a partir do banco depois de cada commit; ou tirar o índice e consultar o
  banco. Para a busca, filtrar em SQL com uma coluna normalizada (migração) ou
  filtrar em Python com `normalizar`.
- **Escolha:** um `threading.Lock` de módulo (`_TRANCA_HABILIDADES`) em
  `salvar_habilidades` envolve desde a leitura das habilidades antigas até o
  fim da sincronização do índice. Ler o "antes" dentro da tranca impede duas
  requisições de removerem o mesmo "antes". As validações (limite, repetidas,
  catálogo) ficam fora. A busca `q=` filtra em Python com `normalizar` sobre
  `username` e `name` (custo O(U) já aceito na decisão 19), e ordena e pagina
  depois do filtro. `normalizar` de `core/catalogo.py` é a única regra de
  comparação sem acento do backend. Também nasce
  `por_username_ou_404(db, username) -> User`: aplica `lower()`, busca a
  pessoa e responde 404 `"pessoa não encontrada"`; as outras issues (#74, #75,
  #77) trocam suas cópias por ele.
- **O que cortamos e por quê:** tranca distribuída ou por pessoa. O índice
  vive em memória de um processo só (um worker no Render), então uma tranca de
  processo basta; uma por pessoa traria mais código para um caso raro.
  Coluna normalizada no banco para a busca exigiria migração e backfill, e com
  dezenas de pessoas o filtro em Python é barato.
- **Como ficou:**
  - Salvar duas vezes rápido deixa o índice igual ao banco (teste com 2
    threads em `backend/tests/test_matches.py`).
  - `GET /usuarios?q=isis` acha "Ísis" e `q=otavio` acha "Otávio"
    (`backend/tests/test_usuarios_busca.py`).
  - `GET /usuarios/AdA` responde 200 para a pessoa `ada`.
  - `matches.py` importa `normalizar`.
