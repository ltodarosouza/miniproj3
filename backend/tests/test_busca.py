def habilidade(client, nome):
    return client.get(f"/habilidades/autocomplete?prefixo={nome}").json()["items"][0]


def marcar(client, quem, itens):
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": hid, "tipo": tipo, "nivel": 3} for hid, tipo in itens],
        headers=quem,
    )
    assert r.status_code < 300, r.text


def buscar(client, quem, q, tipo):
    r = client.get("/busca", params={"q": q, "tipo": tipo}, headers=quem)
    assert r.status_code == 200, r.text
    return r.json()


def test_busca_pessoas_por_nome_arroba_e_bio_sem_acento(client, pessoa):
    ana = pessoa("ana", "Ana Júlia")
    pessoa("bia", "Beatriz")
    caio = pessoa("caio", "Caio")
    client.patch("/usuarios/eu", json={"bio": "Estudo Cálculo"}, headers=caio)

    assert [p["username"] for p in buscar(client, ana, "julia", "pessoas")["pessoas"]] == ["ana"]
    assert [p["username"] for p in buscar(client, ana, "BIA", "pessoas")["pessoas"]] == ["bia"]
    assert [p["username"] for p in buscar(client, ana, "calculo", "pessoas")["pessoas"]] == ["caio"]


def test_busca_posts_pelo_texto_e_pela_habilidade(client, pessoa):
    ana = pessoa("ana")
    calculo = habilidade(client, "Cálculo")["id"]
    client.post("/posts", json={"texto": "revisei derivadas"}, headers=ana)
    client.post("/posts", json={"texto": "lista nova", "habilidade_id": calculo}, headers=ana)
    client.post("/posts", json={"texto": "Cálculo é legal"}, headers=ana)
    client.post("/posts", json={"texto": "nada a ver"}, headers=ana)

    resultado = buscar(client, ana, "calculo", "posts")

    assert resultado["total"] == 2
    assert [p["texto"] for p in resultado["posts"]] == ["Cálculo é legal", "lista nova"]
    assert resultado["pessoas"] == [] and resultado["habilidades"] == []


def test_busca_habilidades_conta_quem_sabe_e_quem_quer(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    calculo = habilidade(client, "Cálculo")
    marcar(client, ana, [(calculo["id"], "sei")])
    marcar(client, bia, [(calculo["id"], "quero_aprender")])

    achadas = buscar(client, ana, "CALCULO", "habilidades")["habilidades"]

    assert achadas[0]["nome"] == calculo["nome"]
    assert achadas[0]["sabem"] == 1
    assert achadas[0]["querem"] == 1


def test_detalhe_da_habilidade_traz_quem_sabe_quem_quer_e_posts(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    calculo = habilidade(client, "Cálculo")["id"]
    marcar(client, ana, [(calculo, "sei")])
    marcar(client, bia, [(calculo, "quero_aprender")])
    client.post("/posts", json={"texto": "limites", "habilidade_id": calculo}, headers=ana)

    r = client.get(f"/busca/habilidades/{calculo}", headers=bia)

    assert r.status_code == 200
    assert [u["username"] for u in r.json()["sabem"]] == ["ana"]
    assert [u["username"] for u in r.json()["querem"]] == ["bia"]
    assert [p["texto"] for p in r.json()["posts"]] == ["limites"]
    assert client.get("/busca/habilidades/99999", headers=bia).status_code == 404


def test_busca_vazia_pagina_e_exige_login(client, pessoa):
    ana = pessoa("ana")
    for nome in ("bruno", "bruna", "brenda"):
        pessoa(nome)

    assert buscar(client, ana, "   ", "pessoas")["total"] == 0
    pagina = client.get(
        "/busca", params={"q": "br", "tipo": "pessoas", "offset": 1, "limit": 1}, headers=ana
    ).json()
    assert pagina["total"] == 3
    assert [p["username"] for p in pagina["pessoas"]] == ["bruna"]
    assert client.get("/busca?q=x").status_code == 401
    assert client.get("/busca?q=x&tipo=outro", headers=ana).status_code == 422


def test_pronto_quando_buscar_calculo_acha_pessoa_post_e_habilidade(client, pessoa):
    ana = pessoa("ana", "Ana")
    caio = pessoa("caio", "Caio")
    client.patch("/usuarios/eu", json={"bio": "Monitor de Cálculo"}, headers=caio)
    calculo = habilidade(client, "Cálculo")
    client.post("/posts", json={"texto": "Revisei Cálculo hoje"}, headers=ana)

    for termo in ("cálculo", "calculo", "CÁLCULO"):
        assert "caio" in [p["username"] for p in buscar(client, ana, termo, "pessoas")["pessoas"]]
        assert "Revisei Cálculo hoje" in [p["texto"] for p in buscar(client, ana, termo, "posts")["posts"]]
        assert calculo["id"] in [h["id"] for h in buscar(client, ana, termo, "habilidades")["habilidades"]]
