from datetime import datetime, timedelta
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
    criada = criar(client, ana, proposta(ids)).json()
    primeira = criada["id"]
    assert criada["respondida_em"] is None
    confirmada = client.post(f"/trocas/{primeira}/confirmar", headers=bia)
    assert confirmada.status_code == 200
    assert confirmada.json()["respondida_em"].endswith("Z")

    segunda = criar(client, ana, proposta(ids)).json()["id"]
    assert client.post(f"/trocas/{segunda}/confirmar", headers=ana).status_code == 403
    assert client.post(f"/trocas/{segunda}/confirmar", headers=caio).status_code == 404
    assert client.post(f"/trocas/{segunda}/recusar", headers=bia).json()["status"] == "recusada"
    assert client.post(f"/trocas/{primeira}/confirmar", headers=bia).status_code == 409
    assert client.post("/trocas/99999/confirmar", headers=bia).status_code == 404


def test_lista_ordena_futuras_e_passadas_e_filtra_por_pessoa(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    ids = habilidades(client)
    datas = ["2030-01-10T10:00:00Z", "2030-01-12T10:00:00Z", "2030-01-14T10:00:00Z", "2030-01-16T10:00:00Z"]
    trocas = []
    for data in datas:
        troca = criar(client, ana, proposta(ids, "bia", data)).json()
        trocas.append(troca)
        if data != datas[-1]:
            with SessionLocal() as db:
                db.get(Troca, troca["id"]).status = "confirmada"
                db.commit()
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
    assert resposta.json()["items"][1]["status"] == "proposta"
    assert client.get("/trocas?com=ausente", headers=ana).status_code == 404
    assert client.get("/trocas?com=caio", headers=ana).json()["items"] == []


def test_segunda_proposta_pendente_do_par_da_409(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    ids = habilidades(client)

    primeira = criar(client, ana, proposta(ids))
    assert primeira.status_code == 201
    repetida = criar(client, ana, proposta(ids))
    assert repetida.status_code == 409
    assert repetida.json()["detail"] == "já existe uma proposta sua aguardando resposta"
    inversa = criar(client, bia, proposta(ids, "ana"))
    assert inversa.status_code == 409
    assert inversa.json()["detail"] == "esta pessoa já te enviou uma proposta, responda antes de propor outra"
    assert criar(client, ana, proposta(ids, "caio")).status_code == 201
    recusada = client.post(f"/trocas/{primeira.json()['id']}/recusar", headers=bia)
    assert recusada.status_code == 200
    segunda = criar(client, ana, proposta(ids))
    assert segunda.status_code == 201
    assert client.post(f"/trocas/{segunda.json()['id']}/confirmar", headers=bia).status_code == 200
    assert criar(client, ana, proposta(ids)).status_code == 201


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


def test_confirmar_proposta_com_horario_passado_da_422(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    id_troca = criar(client, ana, proposta(habilidades(client))).json()["id"]
    monkeypatch.setattr(
        "app.services.trocas.agora_utc",
        lambda: datetime(2030, 1, 10, 13, 0, 1),
    )

    confirmacao = client.post(f"/trocas/{id_troca}/confirmar", headers=bia)
    assert confirmacao.status_code == 422
    assert confirmacao.json()["detail"] == "o horário desta proposta já passou, proponha outra"
    assert client.get("/trocas", headers=ana).json()["items"][0]["status"] == "proposta"
    avaliacao = client.post(
        f"/trocas/{id_troca}/avaliar",
        json={"estrelas": 5, "feedback": "Boa"},
        headers=ana,
    )
    assert avaliacao.status_code == 409

    recusa = client.post(f"/trocas/{id_troca}/recusar", headers=bia)
    assert recusa.status_code == 200
    assert recusa.json()["status"] == "recusada"
    confirmacao_repetida = client.post(f"/trocas/{id_troca}/confirmar", headers=bia)
    assert confirmacao_repetida.status_code == 409


def test_confirmar_usa_o_mesmo_instante_para_validar_e_gravar(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    bia = pessoa("bia")
    ids = habilidades(client)
    horario = datetime(2030, 1, 10, 13, 0)
    no_horario = criar(client, ana, proposta(ids)).json()["id"]

    monkeypatch.setattr("app.services.trocas.agora_utc", lambda: horario)
    assert client.post(f"/trocas/{no_horario}/confirmar", headers=bia).status_code == 422
    assert client.post(f"/trocas/{no_horario}/recusar", headers=bia).status_code == 200

    monkeypatch.setattr("app.services.trocas.agora_utc", agora_utc)
    antes = criar(client, ana, proposta(ids)).json()["id"]
    leituras = iter([horario - timedelta(microseconds=1), horario])
    monkeypatch.setattr("app.services.trocas.agora_utc", lambda: next(leituras))
    confirmada = client.post(f"/trocas/{antes}/confirmar", headers=bia)

    assert confirmada.status_code == 200
    with SessionLocal() as db:
        assert db.get(Troca, antes).respondida_em == horario - timedelta(microseconds=1)
