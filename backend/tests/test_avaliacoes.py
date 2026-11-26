from datetime import timedelta

from app.core.tempo import agora_utc
from app.db import SessionLocal
from app.models.troca import Troca
from app.services.avaliacoes import media_e_total


def habilidades(client):
    items = client.get("/habilidades").json()["items"]
    return {item["nome"]: item["id"] for item in items}


def criar_troca(client, headers, ids, status="confirmada"):
    resposta = client.post(
        "/trocas",
        json={
            "com_username": "bia",
            "data_hora": "2030-01-10T10:00:00Z",
            "link_meet": "https://meet.google.com/abc-defg-hij",
            "habilidade_ensino_id": ids["React"],
            "habilidade_aprendo_id": ids["Cálculo 1"],
        },
        headers=headers,
    )
    assert resposta.status_code == 201
    troca_id = resposta.json()["id"]
    if status == "confirmada":
        resposta = client.post(f"/trocas/{troca_id}/confirmar", headers={"X-User-Id": "2"})
        if resposta.status_code != 200:
            raise AssertionError(resposta.text)
    elif status == "recusada":
        client.post(f"/trocas/{troca_id}/recusar", headers={"X-User-Id": "2"})
    with SessionLocal() as db:
        troca = db.get(Troca, troca_id)
        troca.data_hora = agora_utc() - timedelta(hours=2)
        db.commit()
    return troca_id


def dados(estrelas=5, feedback="Boa troca"):
    return {"estrelas": estrelas, "feedback": feedback}


def avaliar(client, troca_id, headers, payload=None):
    return client.post(
        f"/trocas/{troca_id}/avaliar", json=payload or dados(), headers=headers
    )


def test_pendentes_aparecem_apos_horario_para_participantes_e_somem_individualmente(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    ids = habilidades(client)
    criada = client.post(
        "/trocas",
        json={
            "com_username": "bia",
            "data_hora": "2030-01-10T10:00:00Z",
            "habilidade_ensino_id": ids["React"],
        },
        headers=ana,
    ).json()
    troca_id = criada["id"]
    assert client.get("/trocas/pendentes-avaliacao", headers=ana).json()["items"] == []
    client.post(f"/trocas/{troca_id}/confirmar", headers=bia)
    resposta = client.get("/trocas/pendentes-avaliacao", headers=ana)
    assert resposta.json()["items"] == []
    with SessionLocal() as db:
        db.get(Troca, troca_id).data_hora = agora_utc() - timedelta(hours=2)
        db.commit()
    assert len(client.get("/trocas/pendentes-avaliacao", headers=ana).json()["items"]) == 1
    assert len(client.get("/trocas/pendentes-avaliacao", headers=bia).json()["items"]) == 1
    assert client.get("/trocas/pendentes-avaliacao", headers={"X-User-Id": "3"}).json()["items"] == []
    assert avaliar(client, troca_id, ana).status_code == 201
    assert client.get("/trocas/pendentes-avaliacao", headers=ana).json()["items"] == []
    assert len(client.get("/trocas/pendentes-avaliacao", headers=bia).json()["items"]) == 1


def test_proposta_e_recusada_nao_ficam_pendentes(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    ids = habilidades(client)
    recusada = criar_troca(client, ana, ids, status="recusada")
    proposta = criar_troca(client, ana, ids, status="proposta")
    itens = client.get("/trocas/pendentes-avaliacao", headers=ana).json()["items"]
    assert all(item["id"] not in (proposta, recusada) for item in itens)
    assert avaliar(client, proposta, ana).status_code == 409
    assert avaliar(client, recusada, ana).status_code == 409


def test_regras_de_avaliacao_e_estrelas(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    ids = habilidades(client)
    troca_id = criar_troca(client, ana, ids)
    with SessionLocal() as db:
        db.get(Troca, troca_id).data_hora = agora_utc() + timedelta(hours=2)
        db.commit()
    assert avaliar(client, troca_id, ana).status_code == 409
    with SessionLocal() as db:
        db.get(Troca, troca_id).data_hora = agora_utc() - timedelta(hours=2)
        db.commit()
    assert avaliar(client, troca_id, ana).status_code == 201
    assert avaliar(client, troca_id, ana).status_code == 409
    assert avaliar(client, troca_id, caio).status_code == 403
    assert avaliar(client, troca_id, bia, dados(0)).status_code == 422
    assert avaliar(client, troca_id, bia, dados(6)).status_code == 422
    assert avaliar(client, 99999, ana).status_code == 404


def test_resumo_e_media_total(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    ids = habilidades(client)
    primeira = criar_troca(client, ana, ids)
    segunda = criar_troca(client, ana, ids)
    assert avaliar(client, primeira, ana, dados(4)).status_code == 201
    assert avaliar(client, segunda, ana, dados(5)).status_code == 201
    resumo = client.get("/usuarios/bia/avaliacoes")
    assert resumo.status_code == 200
    assert resumo.json()["media"] == 4.5
    assert resumo.json()["total"] == 2
    assert [item["estrelas"] for item in resumo.json()["items"]] == [5, 4]
    assert client.get("/usuarios/ausente/avaliacoes").status_code == 404
    with SessionLocal() as db:
        bia_id = db.query(Troca).first().com_id
        assert media_e_total(db, bia_id) == (4.5, 2)
        assert media_e_total(db, 99999) == (None, 0)
    sem_avaliacoes = client.get("/usuarios/ana/avaliacoes").json()
    assert sem_avaliacoes["media"] is None
    assert sem_avaliacoes["total"] == 0
