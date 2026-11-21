def test_criar_post_devolve_201_com_autor(client, pessoa):
    ana = pessoa("ana", "Ana")

    r = client.post(
        "/posts",
        json={"texto": "  estudei react  ", "minutos_estudados": 90},
        headers=ana,
    )

    assert r.status_code == 201
    corpo = r.json()
    assert corpo["texto"] == "estudei react"
    assert corpo["autor"]["username"] == "ana"
    assert corpo["minutos_estudados"] == 90
    assert corpo["curtidas"] == 0
    assert corpo["created_at"].endswith("Z")


def test_criar_post_com_habilidade_do_catalogo(client, pessoa):
    ana = pessoa("ana")
    habilidade = client.get("/habilidades").json()["items"][0]

    r = client.post(
        "/posts",
        json={"texto": "estudando", "habilidade_id": habilidade["id"]},
        headers=ana,
    )

    assert r.status_code == 201
    assert r.json()["habilidade"]["id"] == habilidade["id"]


def test_habilidade_inexistente_da_422(client, pessoa):
    ana = pessoa("ana")

    r = client.post("/posts", json={"texto": "oi", "habilidade_id": 9999}, headers=ana)

    assert r.status_code == 422


def test_post_vazio_da_422_e_sem_login_da_401(client, pessoa):
    ana = pessoa("ana")

    assert client.post("/posts", json={"texto": "   "}, headers=ana).status_code == 422
    assert client.post("/posts", json={"texto": "oi"}).status_code == 401


def test_buscar_post_existente_e_inexistente(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "meu post"}, headers=ana).json()["id"]

    r = client.get(f"/posts/{post_id}", headers=ana)

    assert r.status_code == 200
    assert r.json()["texto"] == "meu post"
    assert client.get("/posts/9999", headers=ana).status_code == 404