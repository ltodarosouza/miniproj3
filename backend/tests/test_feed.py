from app.core.limite import limitador_posts
from app.core.matches import indice_matches


def seguir(client, quem, username):
    assert client.post(f"/usuarios/{username}/follow", headers=quem).status_code < 300


def textos(resposta):
    return [item["texto"] for item in resposta.json()["items"]]


def test_feed_cronologico_dos_seguidos(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    client.post("/posts", json={"texto": "post da bia 1"}, headers=bia)
    client.post("/posts", json={"texto": "post da bia 2"}, headers=bia)
    client.post("/posts", json={"texto": "post do caio"}, headers=caio)
    seguir(client, ana, "bia")

    r = client.get("/feed?offset=0&limit=10", headers=ana)

    assert r.status_code == 200
    assert r.json()["total"] == 2
    assert textos(r) == ["post da bia 2", "post da bia 1"]
    assert {item["motivo"] for item in r.json()["items"]} == {"seguindo"}
    assert textos(client.get("/feed?offset=1&limit=1", headers=ana)) == ["post da bia 1"]


def test_feed_de_quem_nao_segue_ninguem_vem_vazio(client, pessoa):
    ana = pessoa("ana")

    r = client.get("/feed", headers=ana)

    assert r.status_code == 200
    assert r.json() == {"items": [], "total": 0, "offset": 0, "limit": 20}


def test_feed_inclui_quem_pode_ensinar_com_motivo(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    dani = pessoa("dani")
    caio_id = int(caio["X-User-Id"])
    monkeypatch.setattr(
        indice_matches, "pode_me_ensinar", lambda usuario_id: {caio_id}
    )
    client.post("/posts", json={"texto": "da bia"}, headers=bia)
    client.post("/posts", json={"texto": "do caio"}, headers=caio)
    client.post("/posts", json={"texto": "da dani"}, headers=dani)
    seguir(client, ana, "bia")

    r = client.get("/feed", headers=ana)

    motivos = {item["texto"]: item["motivo"] for item in r.json()["items"]}
    assert motivos == {"da bia": "seguindo", "do caio": "pode_te_ensinar"}
    assert r.json()["total"] == 2


def test_quem_eu_sigo_e_pode_me_ensinar_aparece_uma_vez_como_seguindo(
    client, pessoa, monkeypatch
):
    ana = pessoa("ana")
    bia = pessoa("bia")
    bia_id = int(bia["X-User-Id"])
    monkeypatch.setattr(
        indice_matches, "pode_me_ensinar", lambda usuario_id: {bia_id}
    )
    client.post("/posts", json={"texto": "da bia"}, headers=bia)
    seguir(client, ana, "bia")

    r = client.get("/feed", headers=ana)

    assert r.json()["total"] == 1
    assert [item["motivo"] for item in r.json()["items"]] == ["seguindo"]


def test_feed_mostra_meus_proprios_posts(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    ana_id = int(ana["X-User-Id"])
    monkeypatch.setattr(
        indice_matches, "pode_me_ensinar", lambda usuario_id: {ana_id}
    )
    client.post("/posts", json={"texto": "meu post"}, headers=ana)
    client.post("/posts", json={"texto": "da bia"}, headers=bia)
    seguir(client, ana, "bia")

    r = client.get("/feed", headers=ana)

    assert textos(r) == ["da bia", "meu post"]
    assert {i["texto"]: i["motivo"] for i in r.json()["items"]}["meu post"] == "meu"


def test_post_publicado_continua_no_feed_de_quem_nao_segue_ninguem(client, pessoa):
    ana = pessoa("ana")
    client.post("/posts", json={"texto": "primeiro post"}, headers=ana)

    r = client.get("/feed", headers=ana)

    assert textos(r) == ["primeiro post"]
    assert r.json()["items"][0]["motivo"] == "meu"


def habilidade(client, nome):
    return client.get(f"/habilidades/autocomplete?prefixo={nome}").json()["items"][0]["id"]


def marcar(client, quem, nome, tipo="sei"):
    hid = habilidade(client, nome)
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": hid, "tipo": tipo, "nivel": 3}],
        headers=quem,
    )
    assert r.status_code < 300, r.text
    return hid


def test_feed_inclui_quem_estuda_o_mesmo_como_descobrir(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    marcar(client, ana, "Python")
    marcar(client, bia, "Python")
    client.post("/posts", json={"texto": "da bia"}, headers=bia)
    client.post("/posts", json={"texto": "do caio"}, headers=caio)

    r = client.get("/feed", headers=ana)

    assert {i["texto"]: i["motivo"] for i in r.json()["items"]} == {"da bia": "descobrir"}


def test_em_alta_conta_posts_da_semana_por_habilidade(client, pessoa):
    ana = pessoa("ana")
    python = habilidade(client, "Python")
    for minutos in (30, 45):
        client.post(
            "/posts",
            json={"texto": "estudei", "habilidade_id": python, "minutos_estudados": minutos},
            headers=ana,
        )
    client.post("/posts", json={"texto": "sem habilidade"}, headers=ana)

    r = client.get("/feed/em-alta", headers=ana)

    assert r.status_code == 200
    assert r.json()[0]["id"] == python
    assert r.json()[0]["posts"] == 2
    assert r.json()[0]["minutos"] == 75
    assert len(r.json()) == 1
    assert client.get("/feed/em-alta").status_code == 401


def test_meu_progresso_soma_a_semana(client, pessoa):
    ana = pessoa("ana")
    client.post("/posts", json={"texto": "a", "minutos_estudados": 20}, headers=ana)
    client.post("/posts", json={"texto": "b"}, headers=ana)

    r = client.get("/feed/meu-progresso", headers=ana)

    assert r.json() == {"streak": 1, "minutos_semana": 20, "posts_semana": 2}


def test_item_do_feed_traz_curtidas_e_comentarios(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "estudei"}, headers=bia).json()["id"]
    seguir(client, ana, "bia")
    client.post(f"/posts/{post_id}/curtir", headers=ana)
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "boa"}, headers=ana)

    item = client.get("/feed", headers=ana).json()["items"][0]

    assert item["autor"]["username"] == "bia"
    assert item["curtidas"] == 1
    assert item["curtido"] is True
    assert item["comentarios"] == 1


def test_feed_exige_login_e_valida_paginacao(client, pessoa):
    ana = pessoa("ana")

    assert client.get("/feed").status_code == 401
    assert client.get("/feed?limit=0", headers=ana).status_code == 422
    assert client.get("/feed?offset=-1", headers=ana).status_code == 422


def test_descobrir_nao_muda_entre_paginas_quando_alguem_publica(client, pessoa, monkeypatch):
    monkeypatch.setattr(limitador_posts, "max_chamadas", 100)
    ana = pessoa("ana")
    bia = pessoa("bia")
    marcar(client, ana, "Python")
    marcar(client, bia, "Python")
    for n in range(12):
        client.post("/posts", json={"texto": f"bia {n}"}, headers=bia)
    for n in range(9):
        client.post("/posts", json={"texto": f"ana {n}"}, headers=ana)
    primeira = client.get("/feed?offset=0&limit=10", headers=ana).json()

    client.post("/posts", json={"texto": "ana 9"}, headers=ana)
    segunda = client.get("/feed?offset=10&limit=10", headers=ana).json()

    assert segunda["total"] == primeira["total"] + 1