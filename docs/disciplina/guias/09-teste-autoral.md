# Guia 09: escrever um teste seu (opcional)

Escrever um teste seu para uma feature é uma boa prática e ajuda a pegar bug
cedo. Não vale nota. Este guia serve para quem nunca escreveu um teste.

## Arrange, act, assert

Todo teste tem três partes. Vejam o modelo que já vem no repo,
`tests/test_autoral_exemplo.py`:

```python
def test_autoral_offset_alem_do_total_devolve_vazio_e_nao_erro(client):
    # ARRANGE: monte o cenário (pela API, nunca direto no banco)
    client.post("/usuarios", json={"username": "ana", "name": "Ana"})

    # ACT: a UMA ação que está sendo testada
    r = client.get("/usuarios?offset=50&limit=10")

    # ASSERT: o que TEM que ser verdade
    assert r.status_code == 200
    assert r.json()["items"] == []
    assert r.json()["total"] == 1
```

Ele testa a paginação além do fim da lista. O contrato do slice diz o que
`GET /usuarios` devolve, mas não diz o que acontece com `offset=50` quando só
existe 1 usuário. Esse é um caso autoral: uma borda que o contrato deixou em
aberto e que vocês decidiram que não pode dar erro.

## Três perguntas

Olhem para a feature e perguntem:

1. E se vier duplicado ou vazio? (segunda curtida no mesmo post, hashtag
   repetida no mesmo texto, texto de 0 caracteres)
2. E sem permissão? (marcar como lida a notificação de outro usuário, votar
   duas vezes na enquete, ver bookmark alheio)
3. E além do limite? (11º item do "últimos 10 visitantes", post nº N+1 do
   rate limit, offset além do total)

Qualquer uma rende um teste autoral. Escolham a que tem mais chance de quebrar.

## Fixtures disponíveis

O `tests/conftest.py` já traz:

- `client`: API com banco zerado a cada teste. Peçam como argumento.
- `logar`: cria um usuário logado (depende da auth do guia 01):

```python
def test_autoral_nao_marco_notificacao_dos_outros(client, logar):
    ana = logar("ana")
    bia = logar("bia")
    # ... ana tenta mexer no que é da bia; espere 403/404
```

Para rodar só os autorais: `uv run pytest -q -k autoral`.

## Um bom teste falha quando a feature quebra

Para conferir, quebre a feature de propósito, em uma linha (inverta o if da
permissão ou tire a checagem de duplicata), rode `uv run pytest -q -k autoral`
e veja o teste ficar vermelho. Depois desfaça com `git checkout <arquivo>`.
Se o teste continuou verde com a feature quebrada, ele não está testando nada.

Copiar o caminho feliz ("crio bookmark, recebo 201") serve pouco. O teste vale
mais quando cobre o que a sugestão do `CONTRATO.md` não diz.
