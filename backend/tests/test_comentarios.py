from conftest import simular_post_apagado_antes_do_commit
from sqlalchemy import text

from app.db import SessionLocal
from app.services import comentarios


def test_comentarios_em_ordem_cronologica(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "comentem"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "primeiro!"}, headers=bia)
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "segundo"}, headers=ana)

    r = client.get(f"/posts/{post_id}/comentarios", headers=ana)

    assert r.status_code == 200
    assert [c["texto"] for c in r.json()["items"]] == ["primeiro!", "segundo"]
    assert [c["autor"]["username"] for c in r.json()["items"]] == ["bia", "ana"]


def test_criar_comentario_devolve_201_com_autor(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    r = client.post(
        f"/posts/{post_id}/comentarios", json={"texto": "  boa dica  "}, headers=bia
    )

    assert r.status_code == 201
    corpo = r.json()
    assert corpo["texto"] == "boa dica"
    assert corpo["autor"]["username"] == "bia"
    assert corpo["post_id"] == post_id
    assert corpo["created_at"].endswith("Z")


def test_comentarios_ficam_no_post_certo(client, pessoa):
    ana = pessoa("ana")
    primeiro = client.post("/posts", json={"texto": "um"}, headers=ana).json()["id"]
    segundo = client.post("/posts", json={"texto": "dois"}, headers=ana).json()["id"]

    client.post(f"/posts/{primeiro}/comentarios", json={"texto": "no um"}, headers=ana)

    assert client.get(f"/posts/{segundo}/comentarios", headers=ana).json()["items"] == []
    assert client.get(f"/posts/{segundo}/comentarios", headers=ana).json()["total"] == 0


def test_comentarios_paginados(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]
    for texto in ("a", "b", "c"):
        client.post(f"/posts/{post_id}/comentarios", json={"texto": texto}, headers=ana)

    r = client.get(f"/posts/{post_id}/comentarios?offset=1&limit=1", headers=ana)

    assert [c["texto"] for c in r.json()["items"]] == ["b"]
    assert r.json()["total"] == 3
    assert client.get(
        f"/posts/{post_id}/comentarios?offset=50", headers=ana
    ).json()["items"] == []


def test_post_mostra_o_total_de_comentarios(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "um"}, headers=bia)
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "dois"}, headers=ana)

    assert client.get(f"/posts/{post_id}", headers=ana).json()["comentarios"] == 2


def test_erros_ao_comentar_e_listar(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]
    url = f"/posts/{post_id}/comentarios"

    assert client.post(url, json={"texto": "   "}, headers=ana).status_code == 422
    assert client.post(url, json={"texto": "x" * 501}, headers=ana).status_code == 422
    assert client.post("/posts/9999/comentarios", json={"texto": "x"}, headers=ana).status_code == 404
    assert client.get("/posts/9999/comentarios", headers=ana).status_code == 404
    assert client.post(url, json={"texto": "x"}).status_code == 401
    assert client.get(url).status_code == 401


def test_apagar_post_leva_os_comentarios_junto(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "vai sumir"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "oi"}, headers=bia)

    client.delete(f"/posts/{post_id}", headers=ana)

    with SessionLocal() as db:
        assert db.scalar(text("select count(*) from comentarios")) == 0


def test_comentar_post_apagado_no_meio_da_404(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "vai sumir"}, headers=bia).json()["id"]
    simular_post_apagado_antes_do_commit(monkeypatch, comentarios, post_id)

    r = client.post(f"/posts/{post_id}/comentarios", json={"texto": "oi"}, headers=ana)

    assert r.status_code == 404
    assert r.json()["detail"] == "post não existe mais"