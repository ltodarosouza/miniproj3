import pytest
from conftest import zerar_banco
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.core.matches import indice_matches
from app.db import SessionLocal
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
    zerar_banco()
    with TestClient(app):
        assert contar(User) >= 30
        assert contar(Post) > 0
        with SessionLocal() as db:
            ids = list(db.scalars(select(User.id)))
        assert any(indice_matches.match_de_troca(i) for i in ids)


def test_seed_on_boot_nao_duplica_banco_com_dados(monkeypatch):
    monkeypatch.setenv("SEED_ON_BOOT", "true")
    zerar_banco()
    with TestClient(app):
        antes = contar(User)
    with TestClient(app):
        assert contar(User) == antes


def test_sem_seed_on_boot_o_banco_fica_vazio(monkeypatch):
    monkeypatch.delenv("SEED_ON_BOOT", raising=False)
    zerar_banco()
    with TestClient(app):
        assert contar(User) == 0


def test_debug_no_render_recusa_o_boot(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.setenv("RENDER", "true")
    with pytest.raises(RuntimeError, match="DEBUG=true proibido"):
        with TestClient(app):
            pass


def test_debug_com_postgres_recusa_o_boot(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.delenv("RENDER", raising=False)
    monkeypatch.setattr("app.main.EH_SQLITE", False)
    with pytest.raises(RuntimeError, match="DEBUG=true proibido"):
        with TestClient(app):
            pass


def test_debug_no_dev_local_sobe_normalmente(monkeypatch):
    monkeypatch.setenv("DEBUG", "true")
    monkeypatch.delenv("RENDER", raising=False)
    with TestClient(app) as cliente:
        assert cliente.get("/saude").status_code == 200
        