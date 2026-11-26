def test_busca_ignora_acento_no_nome(client, pessoa):
    pessoa("isis", "Ísis Borges")
    pessoa("otavio_f", "Otávio Fernandes")
    pessoa("bia", "Bia")

    for termo, username in (("isis", "isis"), ("otavio", "otavio_f"), ("ÍSIS", "isis")):
        resposta = client.get("/usuarios", params={"q": termo})
        assert resposta.status_code == 200
        dados = resposta.json()
        assert dados["total"] == 1
        assert [item["username"] for item in dados["items"]] == [username]


def test_busca_pagina_depois_do_filtro(client, pessoa):
    pessoa("andre_a", "André A")
    pessoa("andre_b", "André B")
    pessoa("andre_c", "André C")
    pessoa("bia", "Beatriz")

    primeira = client.get("/usuarios", params={"q": "andre", "limit": 2, "offset": 0})
    segunda = client.get("/usuarios", params={"q": "andre", "limit": 2, "offset": 2})

    assert primeira.json()["total"] == 3
    assert [item["username"] for item in primeira.json()["items"]] == ["andre_a", "andre_b"]
    assert segunda.json()["total"] == 3
    assert [item["username"] for item in segunda.json()["items"]] == ["andre_c"]


def test_busca_sem_termo_lista_todos(client, pessoa):
    pessoa("ada", "Ada")
    pessoa("bia", "Bia")

    resposta = client.get("/usuarios")

    assert resposta.status_code == 200
    assert resposta.json()["total"] == 2
    assert [item["username"] for item in resposta.json()["items"]] == ["ada", "bia"]


def test_perfil_ignora_maiusculas_no_username(client, pessoa):
    cabecalho = pessoa("ada", "Ada")

    perfil = client.get("/usuarios/AdA")
    posts = client.get("/usuarios/AdA/posts", headers=cabecalho)
    ausente = client.get("/usuarios/ninguem")

    assert perfil.status_code == 200
    assert perfil.json()["username"] == "ada"
    assert posts.status_code == 200
    assert ausente.status_code == 404
    assert ausente.json()["detail"] == "pessoa não encontrada"
