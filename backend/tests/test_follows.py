from sqlalchemy import select

from app.db import SessionLocal
from app.models.user import User
from app.services.follows import contadores


def contadores_de(username):
    with SessionLocal() as db:
        usuario = db.scalar(select(User).where(User.username == username))
        return contadores(db, usuario.id)


def test_seguir_e_idempotente_e_atualiza_contadores(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")

    r = client.post("/usuarios/bia/follow", headers=ana)
    assert r.status_code == 200
    assert r.json() == {"seguindo": True, "seguidores": 1}

    r = client.post("/usuarios/bia/follow", headers=ana)
    assert r.json() == {"seguindo": True, "seguidores": 1}
    assert contadores_de("bia").seguidores == 1
    assert contadores_de("ana").seguindo == 1


def test_deixar_de_seguir_e_idempotente(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    client.post("/usuarios/bia/follow", headers=ana)

    r = client.delete("/usuarios/bia/follow", headers=ana)
    assert r.status_code == 200
    assert r.json() == {"seguindo": False, "seguidores": 0}

    r = client.delete("/usuarios/bia/follow", headers=ana)
    assert r.status_code == 200
    assert contadores_de("bia").seguidores == 0
    assert contadores_de("ana").seguindo == 0


def test_nao_segue_a_si_mesmo_nem_inexistente(client, pessoa):
    ana = pessoa("ana")
    assert client.post("/usuarios/ana/follow", headers=ana).status_code == 422
    assert client.post("/usuarios/ninguem/follow", headers=ana).status_code == 404
    assert client.get("/usuarios/ninguem/seguidores").status_code == 404


def test_seguir_exige_login(client, pessoa):
    pessoa("bia")
    assert client.post("/usuarios/bia/follow").status_code == 401


def test_listas_de_seguidores_e_seguindo(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    client.post("/usuarios/caio/follow", headers=ana)
    client.post("/usuarios/caio/follow", headers=bia)
    client.post("/usuarios/bia/follow", headers=ana)

    r = client.get("/usuarios/caio/seguidores").json()
    assert r["total"] == 2
    assert {u["username"] for u in r["items"]} == {"ana", "bia"}

    r = client.get("/usuarios/ana/seguindo?limit=1").json()
    assert r["total"] == 2
    assert len(r["items"]) == 1
    assert r["items"][0]["username"] == "bia"

    assert client.get("/usuarios/caio/seguindo").json()["total"] == 0


def test_estado_do_follow_para_quem_esta_logado(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    assert client.get("/usuarios/bia/follow", headers=ana).json() == {"seguindo": False, "seguidores": 0}
    client.post("/usuarios/bia/follow", headers=ana)
    assert client.get("/usuarios/bia/follow", headers=ana).json() == {"seguindo": True, "seguidores": 1}
    assert client.get("/usuarios/bia/follow", headers=bia).json() == {"seguindo": False, "seguidores": 1}
