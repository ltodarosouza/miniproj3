# Guia 02: Git em equipe

O combinado do time é que cada integrante tenha commits relevantes e PRs
revisados por outra pessoa, e que toda feature tenha uma issue, fechada pelo PR
do dono com `Closes #N`. Issues, commits e reviews não entram na nota, mas a
banca olha o histórico para entender quem fez o quê. Commitem todo dia.

## O fluxo diário

```bash
# 1. comece o dia atualizado
git checkout main && git pull

# 2. uma branch por feature (a MESMA feature da sua issue)
git checkout -b feat/curtidas

# 3. trabalhe, commite pequeno e com porquê
git add backend/app/routers/curtidas.py
git commit -m "curtir post: endpoint idempotente (2º like não duplica)"

# 4. suba e abra o PR
git push -u origin feat/curtidas
```

No PR, pela interface do GitHub, escrevam uma descrição curta e `Closes #12`,
com o número da issue da feature. Peçam review de um colega do time. Quem
aprova não é quem escreveu. Façam o merge pelo botão e apaguem a branch.

## Conflito em main.py

Vai acontecer, porque todo mundo registra router em `main.py`. São 5 comandos:

```bash
git checkout main && git pull
git checkout feat/curtidas
git merge main
# → Auto-merging backend/app/main.py
#   CONFLICT (content): Merge conflict in backend/app/main.py
#   Automatic merge failed; fix conflicts and then commit the result.
```

Abram `backend/app/main.py`. O conflito tem esta cara:

```python
<<<<<<< HEAD
app.include_router(curtidas.router)
=======
app.include_router(posts.router)
>>>>>>> main
```

Aqui a resolução é sempre a mesma: as duas linhas ficam, e os dois imports
também. Apaguem só os marcadores `<<<<<<<`, `=======`, `>>>>>>>`:

```python
app.include_router(posts.router)
app.include_router(curtidas.router)
```

Para terminar:

```bash
git add backend/app/main.py
git commit          # aceita a mensagem padrão de merge
git push
# → o PR atualiza sozinho, sem conflito
```

Por isso o template tem um arquivo por router e um por model: o único ponto
de colisão é uma linha de `include_router`. Se duas pessoas editam o mesmo
arquivo de router, o conflito fica dentro da lógica. Nesse caso, sentem juntos,
resolvam linha a linha e revejam a divisão de donos.

## Commitei o app.db

O `.gitignore` do template já bloqueia `*.db`. Se o `git status` mostra
`app.db`, alguém mexeu no `.gitignore` ou forçou com `-f`. Para consertar:

```bash
git rm --cached backend/app.db
# → rm 'backend/app.db'        (sai do git, MAS continua no seu disco)
git commit -m "remove app.db do versionamento (banco é local)"
git push
```

Confiram que a linha `*.db` existe no `.gitignore`. Binário no git gera
conflito que não se resolve. O banco de cada um é local e se reconstrói com
`make seed`.

## O que é commit relevante

Commit que muda comportamento ou testes. `fix typo`, reindentação e uma série
de "atualiza README" não contam. Poucos commits gigantes mostram menos autoria
do que mudanças pequenas e verificáveis. Para ver quantos commits cada pessoa
tem, usem `git shortlog -sn --no-merges`.
