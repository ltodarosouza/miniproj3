from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.deps import get_current_user
from app.models.user import User


def test_bypass_de_auth(client, monkeypatch):
    resposta = client.post(
        "/usuarios",
        json={"username": "ana", "name": "Ana"},
    )
    assert resposta.status_code == 201
    usuario = resposta.json()

    app = FastAPI()

    @app.get("/protegida")
    def protegida(user: User = Depends(get_current_user)):
        return {"id": user.id, "username": user.username}

    protegido = TestClient(app)

    monkeypatch.setenv("DEBUG", "true")
    resposta = protegido.get(
        "/protegida", headers={"X-User-Id": str(usuario["id"])}
    )
    assert resposta.status_code == 200
    assert resposta.json() == {"id": usuario["id"], "username": "ana"}

    assert protegido.get("/protegida").status_code == 401
    assert protegido.get("/protegida", headers={"X-User-Id": "999999"}).status_code == 401

    monkeypatch.delenv("DEBUG", raising=False)
    resposta = protegido.get(
        "/protegida", headers={"X-User-Id": str(usuario["id"])}
    )
    assert resposta.status_code == 401
