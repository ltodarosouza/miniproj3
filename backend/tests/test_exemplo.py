"""Testes do slice de exemplo — já passam no clone. Provam que seu setup funciona
e mostram a anatomia que os seus testes vão imitar: arrange → act → assert.
"""

import pytest


def test_lista_usuarios_paginada(client):
    # arrange: cria 2 usuários pela API (todo dado de teste nasce pela API)
    client.post("/usuarios", json={"username": "ana", "name": "Ana"})
    client.post("/usuarios", json={"username": "bia", "name": "Bia"})

    # act
    r = client.get("/usuarios?offset=0&limit=1")

    # assert: formato de paginação do projeto
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["total"] == 2
    assert len(corpo["items"]) == 1
    assert corpo["items"][0]["username"] == "ana"


def test_cria_usuario_e_aparece_na_lista(client):
    r = client.post("/usuarios", json={"username": "carla", "name": "Carla"})
    assert r.status_code == 201
    assert r.json()["username"] == "carla"

    r = client.get("/usuarios")
    assert [u["username"] for u in r.json()["items"]] == ["carla"]


def test_sabotagem_exemplo_core_e_usado_de_verdade(client, monkeypatch):
    """TESTE-SABOTAGEM (um jeito de checar o seu próprio core/):

    quebra a estrutura do core/ e verifica que o endpoint quebra junto.
    Se o endpoint continuasse respondendo 200, o core/ seria "de teatro":
    bonito no arquivo, ignorado pela API.
    """
    from app.core import contadores

    def explode() -> dict:
        raise RuntimeError("sabotado")

    monkeypatch.setattr(contadores.contador_iniciais, "contagem", explode)

    with pytest.raises(RuntimeError, match="sabotado"):
        client.get("/usuarios/stats")
