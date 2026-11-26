from conftest import simular_post_apagado_antes_do_commit
from sqlalchemy import text

from app.db import SessionLocal
from app.services import curtidas


def test_curtir_duas_vezes_conta_uma(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "curte aí"}, headers=bia).json()["id"]

    assert client.post(f"/posts/{post_id}/curtir", headers=ana).status_code == 204
    assert client.post(f"/posts/{post_id}/curtir", headers=ana).status_code == 204

    para_ana = client.get(f"/posts/{post_id}", headers=ana).json()
    assert para_ana["curtidas"] == 1
    assert para_ana["curtido"] is True
    para_bia = client.get(f"/posts/{post_id}", headers=bia).json()
    assert para_bia["curtidas"] == 1
    assert para_bia["curtido"] is False


def test_descurtir_e_idempotente(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "curte aí"}, headers=bia).json()["id"]
    client.post(f"/posts/{post_id}/curtir", headers=ana)

    assert client.delete(f"/posts/{post_id}/curtir", headers=ana).status_code == 204
    assert client.delete(f"/posts/{post_id}/curtir", headers=ana).status_code == 204

    post = client.get(f"/posts/{post_id}", headers=ana).json()
    assert post["curtidas"] == 0
    assert post["curtido"] is False


def test_curtidas_de_pessoas_diferentes_somam(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    post_id = client.post("/posts", json={"texto": "popular"}, headers=caio).json()["id"]

    client.post(f"/posts/{post_id}/curtir", headers=ana)
    client.post(f"/posts/{post_id}/curtir", headers=bia)

    assert client.get(f"/posts/{post_id}", headers=caio).json()["curtidas"] == 2


def test_descurtir_nao_apaga_a_curtida_dos_outros(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    post_id = client.post("/posts", json={"texto": "popular"}, headers=caio).json()["id"]
    client.post(f"/posts/{post_id}/curtir", headers=ana)
    client.post(f"/posts/{post_id}/curtir", headers=bia)

    client.delete(f"/posts/{post_id}/curtir", headers=ana)

    assert client.get(f"/posts/{post_id}", headers=bia).json()["curtidas"] == 1


def test_curtir_post_inexistente_da_404_e_sem_login_da_401(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    assert client.post("/posts/9999/curtir", headers=ana).status_code == 404
    assert client.delete("/posts/9999/curtir", headers=ana).status_code == 404
    assert client.post(f"/posts/{post_id}/curtir").status_code == 401


def test_apagar_post_leva_as_curtidas_junto(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "vai sumir"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/curtir", headers=bia)

    client.delete(f"/posts/{post_id}", headers=ana)

    with SessionLocal() as db:
        assert db.scalar(text("select count(*) from likes")) == 0


def test_curtir_post_apagado_no_meio_da_404(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "vai sumir"}, headers=bia).json()["id"]
    simular_post_apagado_antes_do_commit(monkeypatch, curtidas, post_id)

    r = client.post(f"/posts/{post_id}/curtir", headers=ana)

    assert r.status_code == 404
    assert r.json()["detail"] == "post não existe mais"