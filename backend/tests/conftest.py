"""Infra dos testes: banco descartável + client + helpers de auth.

Os testes falam com a API só por HTTP (TestClient) — exatamente como o frontend.
"""

import os
import sys
import tempfile
from pathlib import Path

# roda de backend/ (make test) ou de onde for — o import de `app` sempre funciona
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# banco descartável POR SESSÃO de teste, antes de qualquer import de app.*
_tmp_db = Path(tempfile.mkdtemp(prefix="trilha-test-")) / "test.db"
os.environ["DATABASE_URL"] = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{_tmp_db}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

MSG_AUTH = (
    "auth ainda não implementada — este teste depende de registro/login. "
    "Siga docs/guias/01-autenticacao.md."
)

SENHA_PADRAO = "senha-forte-123"


def zerar_banco() -> None:
    from app.db import Base, engine

    Base.metadata.drop_all(engine)
    with engine.begin() as conexao:
        conexao.exec_driver_sql("DROP TABLE IF EXISTS alembic_version")


@pytest.fixture()
def client():
    """Client com banco zerado por teste. O lifespan roda (cria tabelas + core/)."""
    from app.main import app

    zerar_banco()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def logar(client):
    """Fábrica: cria usuário PELAS ROTAS DO SEU time e devolve o header Authorization.

    Use em qualquer teste que precise de gente logada:
        ana = logar("ana")
        client.post("/posts", json={...}, headers=ana)
    Fica VERMELHO até a auth existir — é proposital (guia 01).
    """

    def _logar(username: str, name: str = "Alguém") -> dict:
        r = client.post(
            "/auth/registro",
            json={"username": username, "name": name, "password": SENHA_PADRAO},
        )
        assert r.status_code == 201, MSG_AUTH
        r = client.post(
            "/auth/login", json={"username": username, "password": SENHA_PADRAO}
        )
        assert r.status_code == 200, MSG_AUTH
        return {"Authorization": f"Bearer {r.json()['token']}"}

    return _logar


@pytest.fixture()
def auth_client(client, logar):
    """Client já autenticado (header fixado). Vermelho até a auth do time existir."""
    client.headers.update(logar("tester_auth", "Tester"))
    return client


@pytest.fixture()
def pessoa(client, monkeypatch):
    monkeypatch.setenv("DEBUG", "true")

    def _pessoa(username: str, name: str | None = None) -> dict:
        r = client.post("/usuarios", json={"username": username, "name": name or username.title()})
        assert r.status_code == 201
        return {"X-User-Id": str(r.json()["id"])}

    return _pessoa


@pytest.fixture(autouse=True)
def limpar_limitador_posts():
    from app.core.limite import limitador_posts

    limitador_posts.limpar()
    yield
    limitador_posts.limpar()


def simular_post_apagado_antes_do_commit(monkeypatch, servico, post_id: int) -> None:
    """Apaga o post logo depois da checagem do serviço e faz o commit falhar como
    o Postgres faria (chave estrangeira violada). O SQLite dos testes não confere FK."""
    from sqlalchemy import delete
    from sqlalchemy.exc import IntegrityError

    from app.db import SessionLocal
    from app.models.post import Post

    buscar_original = servico.buscar

    def buscar_e_apagar(db, pid):
        post = buscar_original(db, pid)
        with SessionLocal() as outra:
            outra.execute(delete(Post).where(Post.id == post_id))
            outra.commit()
        commit_original = db.commit

        def commit_que_falha():
            db.commit = commit_original
            raise IntegrityError("INSERT", {}, Exception("FOREIGN KEY constraint failed"))

        db.commit = commit_que_falha
        return post

    monkeypatch.setattr(servico, "buscar", buscar_e_apagar)