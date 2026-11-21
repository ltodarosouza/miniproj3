def test_enviar_mensagem(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    resposta = client.post("/dms/bia", json={"texto": " Oi, tudo bem? "}, headers=ana)
    assert resposta.status_code == 201
    assert resposta.json()["de_username"] == "ana"
    assert resposta.json()["para_username"] == "bia"
    assert resposta.json()["texto"] == "Oi, tudo bem?"
    assert resposta.json()["em"].endswith("Z")


def test_erros_ao_enviar_mensagem(client, pessoa):
    ana = pessoa("ana")
    resposta = client.post("/dms/ana", json={"texto": "oi"}, headers=ana)
    assert resposta.status_code == 422
    assert resposta.json()["detail"] == "você não pode mandar mensagem para si mesmo"

    resposta = client.post("/dms/inexistente", json={"texto": "oi"}, headers=ana)
    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "usuário não encontrado"

    pessoa("bia")
    resposta = client.post("/dms/bia", json={"texto": "   "}, headers=ana)
    assert resposta.status_code == 422

    resposta = client.post("/dms/bia", json={"texto": "oi"})
    assert resposta.status_code == 401


def test_listar_conversa_em_ordem_e_dos_dois_lados(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    client.post("/dms/bia", json={"texto": "primeira"}, headers=ana)
    client.post("/dms/ana", json={"texto": "segunda"}, headers=bia)
    resposta = client.get("/dms/bia", headers=ana)
    assert resposta.status_code == 200
    assert [item["texto"] for item in resposta.json()["items"]] == ["primeira", "segunda"]
    assert [item["de_username"] for item in resposta.json()["items"]] == ["ana", "bia"]


def test_polling_e_limite_de_mensagens(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    ids = []
    for texto in ("uma", "duas", "três"):
        resposta = client.post("/dms/bia", json={"texto": texto}, headers=ana)
        ids.append(resposta.json()["id"])
    client.post("/dms/ana", json={"texto": "quatro"}, headers=bia)

    novas = client.get(f"/dms/bia?depois_de={ids[1]}", headers=ana)
    assert [item["texto"] for item in novas.json()["items"]] == ["três", "quatro"]
    recentes = client.get("/dms/bia?limit=2", headers=ana)
    assert [item["texto"] for item in recentes.json()["items"]] == ["três", "quatro"]


def test_isolamento_entre_conversas(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    pessoa("caio")
    client.post("/dms/bia", json={"texto": "com bia"}, headers=ana)
    client.post("/dms/caio", json={"texto": "com caio"}, headers=ana)
    resposta = client.get("/dms/bia", headers=ana)
    assert [item["texto"] for item in resposta.json()["items"]] == ["com bia"]


def test_listar_conversas_mais_recentes_primeiro_e_dos_dois_lados(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    client.post("/dms/bia", json={"texto": "conversa antiga"}, headers=ana)
    client.post("/dms/ana", json={"texto": "resposta da bia"}, headers=bia)
    client.post("/dms/caio", json={"texto": "conversa recente"}, headers=ana)

    resposta = client.get("/dms", headers=ana)

    assert resposta.status_code == 200
    assert [item["com"]["username"] for item in resposta.json()["items"]] == [
        "caio",
        "bia",
    ]
    assert [item["ultima_mensagem"] for item in resposta.json()["items"]] == [
        "conversa recente",
        "resposta da bia",
    ]
    assert [item["ultima_de_mim"] for item in resposta.json()["items"]] == [
        True,
        False,
    ]


def test_listar_conversa_com_apenas_mensagens_recebidas(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    client.post("/dms/ana", json={"texto": "mensagem recebida"}, headers=bia)

    resposta = client.get("/dms", headers=ana)

    assert resposta.status_code == 200
    assert len(resposta.json()["items"]) == 1
    assert resposta.json()["items"][0]["com"]["username"] == "bia"
    assert resposta.json()["items"][0]["ultima_mensagem"] == "mensagem recebida"
    assert resposta.json()["items"][0]["ultima_de_mim"] is False


def test_listar_conversas_isola_terceira_pessoa_e_exige_autenticacao(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    client.post("/dms/bia", json={"texto": "privada"}, headers=ana)

    resposta = client.get("/dms", headers=caio)
    assert resposta.status_code == 200
    assert resposta.json()["items"] == []

    resposta = client.get("/dms")
    assert resposta.status_code == 401
