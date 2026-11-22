from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.matches import indice_matches
from app.db import Base, SessionLocal, engine
from app.main import app, origens_permitidas
from app.models.post import Post
from app.models.user import User


def contar(modelo) -> int:
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(modelo))


def test_saude_responde_sem_login(client):
    r = client.get("/saude")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_cors_aceita_origens_da_variavel(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", " https://troca.vercel.app/ ,https://outra.app,,http://localhost:3000")
    assert origens_permitidas() == [
        "http://localhost:3000",
        "https://troca.vercel.app",
        "https://outra.app",
    ]


def test_cors_sem_variavel_fica_so_no_localhost(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert origens_permitidas() == ["http://localhost:3000"]


def test_seed_on_boot_popula_banco_vazio_e_monta_o_indice(monkeypatch):
    monkeypatch.setenv("SEED_ON_BOOT", "true")
    Base.metadata.drop_all(engine)
    with TestClient(app):
        assert contar(User) >= 30
        assert contar(Post) > 0
        with SessionLocal() as db:
            ids = list(db.scalars(select(User.id)))
        assert any(indice_matches.match_de_troca(i) for i in ids)


def test_seed_on_boot_nao_duplica_banco_com_dados(monkeypatch):
    monkeypatch.setenv("SEED_ON_BOOT", "true")
    Base.metadata.drop_all(engine)
    with TestClient(app):
        antes = contar(User)
    with TestClient(app):
        assert contar(User) == antes


def test_sem_seed_on_boot_o_banco_fica_vazio(monkeypatch):
    monkeypatch.delenv("SEED_ON_BOOT", raising=False)
    Base.metadata.drop_all(engine)
    with TestClient(app):
        assert contar(User) == 0
