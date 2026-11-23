from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from app.core.tempo import agora_utc
from app.db import SessionLocal
from app.models.troca import Troca
from tests.test_matches import marcar


def habilidades(client):
    items = client.get("/habilidades").json()["items"]
    return {item["nome"]: item["id"] for item in items}


def proposta(ids, com="bia", data_hora="2030-01-10T10:00:00-03:00"):
    return {
        "com_username": com,
        "data_hora": data_hora,
        "habilidade_ensino_id": ids["React"],
        "habilidade_aprendo_id": ids["Cálculo 1"],
    }


def criar(client, headers, dados):
    return client.post("/trocas", json=dados, headers=headers)


def test_cria_troca_com_link_google_agenda_e_utc(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    ids = habilidades(client)

    resposta = criar(client, ana, proposta(ids))

    assert resposta.status_code == 201
    troca = resposta.json()
    assert troca["status"] == "proposta"
    assert troca["proposta_por"]["username"] == "ana"
    assert troca["com"]["username"] == "bia"
    assert troca["data_hora"] == "2030-01-10T13:00:00Z"
    assert troca["habilidade_ensino"]["nome"] == "React"
    assert troca["habilidade_aprendo"]["nome"] == "Cálculo 1"
    consulta = parse_qs(urlparse(troca["link_google_agenda"]).query)
    assert consulta["action"] == ["TEMPLATE"]
    assert consulta["dates"] == ["20300110T130000Z/20300110T140000Z"]
    assert consulta["text"] == ["Troca: React ↔ Cálculo 1"]
    assert "@ana ensina React para @bia" in consulta["details"][0]
    assert "@bia ensina Cálculo 1 para @ana" in consulta["details"][0]
    assert "location" not in consulta
    assert troca["link_meet"] == ""


def test_cria_troca_com_uma_habilidade(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    ids = habilidades(client)
    dados = proposta(ids)
    dados["habilidade_aprendo_id"] = None

    resposta = criar(client, ana, dados)

    assert resposta.status_code == 201
    consulta = parse_qs(urlparse(resposta.json()["link_google_agenda"]).query)
    assert consulta["text"] == ["Troca: React"]


def test_erros_ao_criar_troca(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    ids = habilidades(client)
    dados = proposta(ids)

    assert criar(client, ana, proposta(ids, com="inexistente")).status_code == 404
    assert criar(client, ana, proposta(ids, com="ana")).status_code == 422
    assert criar(client, ana, proposta(ids, data_hora="2020-01-10T10:00:00Z")).status_code == 422
    dados["habilidade_aprendo_id"] = 99999
    assert criar(client, ana, dados).status_code == 422
    dados["habilidade_aprendo_id"] = ids["React"]
    assert criar(client, ana, dados).status_code == 422
    dados["habilidade_aprendo_id"] = None
    dados["habilidade_ensino_id"] = None
    assert criar(client, ana, dados).status_code == 422


def test_confirmar_recusar_e_permissoes(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    ids = habilidades(client)
    primeira = criar(client, ana, proposta(ids)).json()["id"]
    segunda = criar(client, ana, proposta(ids)).json()["id"]

    assert criar(client, ana, proposta(ids)).json()["respondida_em"] is None
    confirmada = client.post(f"/trocas/{primeira}/confirmar", headers=bia)
    assert confirmada.status_code == 200
    assert confirmada.json()["respondida_em"].endswith("Z")
    assert client.post(f"/trocas/{segunda}/recusar", headers=bia).json()["status"] == "recusada"
    assert client.post(f"/trocas/{primeira}/confirmar", headers=bia).status_code == 409
    assert client.post(f"/trocas/{segunda}/confirmar", headers=ana).status_code == 403
    assert client.post(f"/trocas/{segunda}/confirmar", headers=caio).status_code == 404
    assert client.post("/trocas/99999/confirmar", headers=bia).status_code == 404


def test_lista_ordena_futuras_e_passadas_e_filtra_por_pessoa(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    ids = habilidades(client)
    datas = ["2030-01-10T10:00:00Z", "2030-01-12T10:00:00Z", "2030-01-14T10:00:00Z", "2030-01-16T10:00:00Z"]
    trocas = [criar(client, ana, proposta(ids, "bia", data)).json() for data in datas]
    with SessionLocal() as db:
        for troca, horas in zip(trocas[:2], (4, 2)):
            registro = db.get(Troca, troca["id"])
            registro.data_hora = agora_utc() - timedelta(hours=horas)
        db.commit()

    resposta = client.get("/trocas", headers=ana)
    assert resposta.status_code == 200
    assert [item["id"] for item in resposta.json()["items"]] == [trocas[2]["id"], trocas[3]["id"], trocas[1]["id"], trocas[0]["id"]]
    filtrada = client.get("/trocas?com=bia", headers=ana)
    assert len(filtrada.json()["items"]) == 4
    assert client.get("/trocas?com=ausente", headers=ana).status_code == 404
    assert client.get("/trocas?com=caio", headers=ana).json()["items"] == []


def test_link_vindo_do_formulario_e_ignorado(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    dados = proposta(habilidades(client))
    dados["link_meet"] = "https://exemplo.com/sala"

    resposta = criar(client, ana, dados)

    assert resposta.status_code == 201
    assert resposta.json()["link_meet"] == ""


def nomes(itens):
    return [(h["nome"], h["nivel"]) for h in itens]


def test_opcoes_para_par_de_troca(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    marcar(ana, "Python", "sei", 4)
    marcar(ana, "Git", "sei", 2)
    marcar(ana, "React", "quero_aprender")
    marcar(bia, "Python", "quero_aprender")
    marcar(bia, "React", "sei", 5)
    marcar(bia, "Cálculo 1", "sei", 3)

    corpo = client.get("/trocas/opcoes/bia", headers=ana).json()

    assert nomes(corpo["eu_ensino"]) == [("Python", 4)]
    assert nomes(corpo["eu_aprendo"]) == [("React", 5)]


def test_opcoes_para_quem_so_pode_me_ensinar(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    marcar(ana, "Python", "sei", 4)
    marcar(ana, "React", "quero_aprender")
    marcar(bia, "React", "sei", 5)

    corpo = client.get("/trocas/opcoes/bia", headers=ana).json()

    assert corpo["eu_ensino"] == []
    assert nomes(corpo["eu_aprendo"]) == [("React", 5)]


def test_opcoes_sem_nada_em_comum_e_pessoa_inexistente(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    marcar(ana, "Python", "sei")
    marcar(bia, "Git", "sei")

    assert client.get("/trocas/opcoes/bia", headers=ana).json() == {"eu_ensino": [], "eu_aprendo": []}
    assert client.get("/trocas/opcoes/ninguem", headers=ana).status_code == 404


def test_opcoes_com_mesma_habilidade_em_sei_e_quero(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    marcar(ana, "React", "sei", 2)
    marcar(ana, "React", "quero_aprender")
    marcar(bia, "React", "sei", 5)
    marcar(bia, "React", "quero_aprender")

    corpo = client.get("/trocas/opcoes/bia", headers=ana).json()

    assert nomes(corpo["eu_ensino"]) == [("React", 2)]
    assert nomes(corpo["eu_aprendo"]) == [("React", 5)]


def test_opcoes_comigo_mesmo(client, pessoa):
    ana = pessoa("ana")
    assert client.get("/trocas/opcoes/ana", headers=ana).status_code == 422
