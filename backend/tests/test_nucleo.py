"""NÚCLEO — a spec executável. Cada @skip é uma tarefa sua.

Ciclo: remova o @skip → make test → veja FALHAR → implemente até ficar verde.
`skipped` é uma tarefa que ainda falta. Estes testes são um roteiro, não valem nota.

Eles fixam o contrato do núcleo: rota, corpo e resposta. Renomear uma rota faz o
teste falhar, então mudem o teste junto se mudarem o contrato.
"""

import pytest
from sqlalchemy import text

SENHA = "senha-forte-123"


# ---------- AUTH (guia 01 — um passo do guia por teste) ----------


def test_auth_registro(client):
    r = client.post(
        "/auth/registro", json={"username": "ana", "name": "Ana", "password": SENHA}
    )
    assert r.status_code == 201
    corpo = r.json()
    assert corpo["username"] == "ana"
    assert "password" not in corpo and "password_hash" not in corpo

    # username duplicado → 409
    r = client.post(
        "/auth/registro", json={"username": "ana", "name": "Outra", "password": SENHA}
    )
    assert r.status_code == 409


def test_auth_login(client):
    client.post(
        "/auth/registro", json={"username": "ana", "name": "Ana", "password": SENHA}
    )

    r = client.post("/auth/login", json={"username": "ana", "password": SENHA})
    assert r.status_code == 200
    assert isinstance(r.json()["token"], str) and len(r.json()["token"]) >= 16

    r = client.post("/auth/login", json={"username": "ana", "password": "errada"})
    assert r.status_code == 401


def test_auth_eu(client, logar):
    headers = logar("ana", "Ana")

    r = client.get("/auth/eu", headers=headers)
    assert r.status_code == 200
    assert r.json()["username"] == "ana"

    # sem token → 401 (rota protegida de verdade)
    r = client.get("/auth/eu")
    assert r.status_code == 401


# ---------- POSTS ----------


@pytest.mark.skip(reason="Remova ao implementar POST/GET/PATCH/DELETE /posts (núcleo; imite o slice)")
def test_posts_crud(client, logar):
    ana = logar("ana")
    bia = logar("bia")

    r = client.post("/posts", json={"texto": "meu primeiro post"}, headers=ana)
    assert r.status_code == 201
    post_id = r.json()["id"]

    r = client.get(f"/posts/{post_id}", headers=ana)
    assert r.status_code == 200
    assert r.json()["texto"] == "meu primeiro post"

    r = client.patch(f"/posts/{post_id}", json={"texto": "editado"}, headers=ana)
    assert r.status_code == 200
    assert r.json()["texto"] == "editado"

    # só o autor mexe no próprio post
    assert client.delete(f"/posts/{post_id}", headers=bia).status_code == 403
    assert client.delete(f"/posts/{post_id}", headers=ana).status_code == 204
    assert client.get(f"/posts/{post_id}", headers=ana).status_code == 404


# ---------- FEED ----------


@pytest.mark.skip(reason="Remova ao implementar GET /feed cronológico paginado (núcleo)")
def test_feed_cronologico_dos_seguidos(client, logar):
    ana = logar("ana")
    bia = logar("bia")
    caio = logar("caio")

    client.post("/posts", json={"texto": "post da bia 1"}, headers=bia)
    client.post("/posts", json={"texto": "post da bia 2"}, headers=bia)
    client.post("/posts", json={"texto": "post do caio"}, headers=caio)

    # ana segue só a bia → feed dela tem só posts da bia, mais novo primeiro
    client.post("/usuarios/bia/follow", headers=ana)

    r = client.get("/feed?offset=0&limit=10", headers=ana)
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["total"] == 2
    assert [p["texto"] for p in corpo["items"]] == ["post da bia 2", "post da bia 1"]

    # paginação: "carregar mais"
    r = client.get("/feed?offset=1&limit=1", headers=ana)
    assert [p["texto"] for p in r.json()["items"]] == ["post da bia 1"]


# ---------- PERFIL ----------


@pytest.mark.skip(reason="Remova ao implementar perfil: PATCH /usuarios/eu + GET /usuarios/{username} (núcleo)")
def test_perfil_editavel(client, logar):
    ana = logar("ana", "Ana")

    r = client.patch(
        "/usuarios/eu",
        json={"bio": "oi, sou a ana", "avatar_url": "https://exemplo.com/a.png"},
        headers=ana,
    )
    assert r.status_code == 200

    r = client.get("/usuarios/ana", headers=ana)
    assert r.status_code == 200
    assert r.json()["bio"] == "oi, sou a ana"
    assert r.json()["avatar_url"] == "https://exemplo.com/a.png"

    # listagem dos próprios posts, paginada como tudo
    client.post("/posts", json={"texto": "post no perfil"}, headers=ana)
    r = client.get("/usuarios/ana/posts", headers=ana)
    assert r.status_code == 200
    assert r.json()["total"] == 1


# ---------- FOLLOW ----------


@pytest.mark.skip(reason="Remova ao implementar follow/unfollow com contadores (núcleo)")
def test_follow_unfollow_com_contadores(client, logar):
    ana = logar("ana")
    logar("bia")

    r = client.post("/usuarios/bia/follow", headers=ana)
    assert r.status_code in (200, 204)

    # idempotente: seguir de novo não duplica
    client.post("/usuarios/bia/follow", headers=ana)
    assert client.get("/usuarios/bia", headers=ana).json()["seguidores"] == 1
    assert client.get("/usuarios/ana", headers=ana).json()["seguindo"] == 1

    r = client.delete("/usuarios/bia/follow", headers=ana)
    assert r.status_code in (200, 204)
    assert client.get("/usuarios/bia", headers=ana).json()["seguidores"] == 0


# ---------- CURTIDAS ----------


@pytest.mark.skip(reason="Remova ao implementar curtir/descurtir idempotente (núcleo)")
def test_curtidas_idempotentes(client, logar):
    ana = logar("ana")
    bia = logar("bia")

    post_id = client.post("/posts", json={"texto": "curte aí"}, headers=bia).json()["id"]

    client.post(f"/posts/{post_id}/curtir", headers=ana)
    client.post(f"/posts/{post_id}/curtir", headers=ana)  # 2ª vez não duplica

    assert client.get(f"/posts/{post_id}", headers=ana).json()["curtidas"] == 1

    client.delete(f"/posts/{post_id}/curtir", headers=ana)
    assert client.get(f"/posts/{post_id}", headers=ana).json()["curtidas"] == 0


# ---------- COMENTÁRIOS ----------


@pytest.mark.skip(reason="Remova ao implementar comentários planos em ordem cronológica (núcleo)")
def test_comentarios_planos_cronologicos(client, logar):
    ana = logar("ana")
    bia = logar("bia")

    post_id = client.post("/posts", json={"texto": "comentem"}, headers=ana).json()["id"]

    client.post(f"/posts/{post_id}/comentarios", json={"texto": "primeiro!"}, headers=bia)
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "segundo"}, headers=ana)

    r = client.get(f"/posts/{post_id}/comentarios", headers=ana)
    assert r.status_code == 200
    assert [c["texto"] for c in r.json()["items"]] == ["primeiro!", "segundo"]


# ---------- SEED FAKE ----------


def test_seed_fake_popula_a_rede(client):
    # contrato: função seed_fake(db) em scripts/seed.py — a demo nunca começa vazia
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    import seed

    from app.db import SessionLocal

    with SessionLocal() as db:
        seed.seed_fake(db)
        assert (db.scalar(text("select count(*) from users")) or 0) >= 20
        assert (db.scalar(text("select count(*) from posts")) or 0) >= 50
        assert (db.scalar(text("select count(*) from follows")) or 0) >= 20
        assert (db.scalar(text("select count(*) from likes")) or 0) >= 30
