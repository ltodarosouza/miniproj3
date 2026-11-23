import pytest

from app.core import limite
from app.core.limite import LimitadorDeTaxa, limitador_mapear


@pytest.fixture(autouse=True)
def limpar_limitador():
    limitador_mapear.limpar()
    yield
    limitador_mapear.limpar()


def test_mapear_sem_login_retorna_401(client):
    resposta = client.post("/habilidades/mapear", json={"texto": "python"})

    assert resposta.status_code == 401


def test_mapear_limite_de_vinte_chamadas(client, logar, monkeypatch):
    usuario = logar("limite_vinte", "Limite vinte")
    monkeypatch.setattr("app.routers.habilidades.service.mapear_texto", lambda db, texto: None)

    for _ in range(20):
        resposta = client.post("/habilidades/mapear", json={"texto": "python"}, headers=usuario)
        assert resposta.status_code == 200

    resposta = client.post("/habilidades/mapear", json={"texto": "python"}, headers=usuario)

    assert resposta.status_code == 429
    assert resposta.json()["detail"] == "Muitas buscas seguidas. Espere um pouco e tente de novo."


def test_mapear_limite_separado_por_usuario(client, logar, monkeypatch):
    primeira = logar("limite_primeira", "Primeira")
    segunda = logar("limite_segunda", "Segunda")
    monkeypatch.setattr("app.routers.habilidades.service.mapear_texto", lambda db, texto: None)

    for _ in range(20):
        assert client.post("/habilidades/mapear", json={"texto": "python"}, headers=primeira).status_code == 200

    assert client.post("/habilidades/mapear", json={"texto": "python"}, headers=primeira).status_code == 429
    assert client.post("/habilidades/mapear", json={"texto": "python"}, headers=segunda).status_code == 200


def test_limitador_libera_apos_janela(monkeypatch):
    agora = 100.0
    monkeypatch.setattr(limite.time, "monotonic", lambda: agora)
    limitador = LimitadorDeTaxa(1, 10)

    assert limitador.permitir("usuario")
    assert not limitador.permitir("usuario")

    agora += 10

    assert limitador.permitir("usuario")
