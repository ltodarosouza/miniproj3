from datetime import datetime

from sqlalchemy import func, select


def test_enviar_mensagem(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    resposta = client.post("/dms/bia", json={"texto": " Oi, tudo bem? "}, headers=ana)
    assert resposta.status_code == 201
    assert resposta.json()["de_username"] == "ana"
    assert resposta.json()["para_username"] == "bia"
    assert resposta.json()["texto"] == "Oi, tudo bem?"
    assert resposta.json()["em"].endswith("Z")


def test_cliente_id_repetido_retorna_mensagem_existente(client, pessoa):
    from app.db import SessionLocal
    from app.models.mensagem import Mensagem

    ana = pessoa("ana")
    pessoa("bia")
    dados = {"texto": "Oi", "cliente_id": "uuid-1"}
    primeira = client.post("/dms/bia", json=dados, headers=ana)
    segunda = client.post("/dms/bia", json=dados, headers=ana)

    assert primeira.status_code == 201
    assert segunda.status_code == 201
    assert segunda.json()["id"] == primeira.json()["id"]
    assert segunda.json()["cliente_id"] == "uuid-1"
    with SessionLocal() as db:
        assert db.scalar(
            select(func.count(Mensagem.id)).where(
                Mensagem.de_id == int(ana["X-User-Id"]),
                Mensagem.cliente_id == "uuid-1",
            )
        ) == 1


def test_sem_cliente_id_continua_criando_duas_mensagens(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    dados = {"texto": "Oi"}
    primeira = client.post("/dms/bia", json=dados, headers=ana)
    segunda = client.post("/dms/bia", json=dados, headers=ana)

    assert primeira.status_code == 201
    assert segunda.status_code == 201
    assert primeira.json()["id"] != segunda.json()["id"]
    assert primeira.json()["cliente_id"] is None


def test_cliente_id_nao_pode_ser_reutilizado_para_outro_destinatario(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")
    pessoa("caio")
    dados = {"texto": "Oi", "cliente_id": "uuid-1"}
    assert client.post("/dms/bia", json=dados, headers=ana).status_code == 201

    resposta = client.post("/dms/caio", json=dados, headers=ana)

    assert resposta.status_code == 409
    assert resposta.json()["detail"] == "cliente_id já usado"


def test_cursor_entregues_e_cliente_id_no_get(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    enviada = client.post(
        "/dms/bia",
        json={"texto": "Oi", "cliente_id": "uuid-1"},
        headers=ana,
    ).json()

    antes = client.get("/dms/bia", headers=ana).json()
    assert antes["entregues_ate_id"] is None
    assert antes["items"][0]["cliente_id"] == "uuid-1"
    assert client.get("/dms/ana", headers=bia).status_code == 200
    depois = client.get("/dms/bia", headers=ana).json()
    assert depois["entregues_ate_id"] == enviada["id"]
    assert depois["items"][0]["cliente_id"] == "uuid-1"


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

    resposta = client.post(
        "/dms/bia", json={"texto": "oi", "cliente_id": " "}, headers=ana
    )
    assert resposta.status_code == 422
    resposta = client.post(
        "/dms/bia", json={"texto": "oi", "cliente_id": "x" * 65}, headers=ana
    )
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


def test_entregue_lido_e_lidas_ate_id(client, pessoa):
    from app.db import SessionLocal
    from app.models.mensagem import Mensagem

    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    enviada = client.post("/dms/bia", json={"texto": "oi"}, headers=ana).json()
    recebida = client.post("/dms/ana", json={"texto": "olá"}, headers=bia).json()
    client.post("/dms/caio", json={"texto": "outra"}, headers=ana)

    assert client.get("/dms/bia", headers=ana).json()["items"][0]["entregue_em"] is None
    assert client.get("/dms/ana", headers=bia).status_code == 200
    assert client.get("/dms", headers=ana).status_code == 200
    with SessionLocal() as db:
        primeira = db.get(Mensagem, enviada["id"])
        assert primeira.entregue_em is not None
        assert db.get(Mensagem, recebida["id"]).entregue_em is not None

    marcadas = client.post("/dms/ana/lidas", headers=bia)
    assert marcadas.status_code == 200
    assert marcadas.json()["lidas_ate_id"] is None
    conversa = client.get("/dms/bia", headers=ana).json()
    assert conversa["lidas_ate_id"] == enviada["id"]
    assert conversa["items"][0]["lida_em"] is not None
    with SessionLocal() as db:
        assert db.get(Mensagem, recebida["id"]).lida_em is None
        assert db.get(Mensagem, enviada["id"]).lida_em is not None

    assert client.post("/dms/ausente/lidas", headers=ana).status_code == 404
    assert client.post("/dms/ana/lidas", headers=ana).status_code == 422


def test_nao_lidas_conta_mensagens_e_zera_ao_abrir(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    client.post("/dms/bia", json={"texto": "uma"}, headers=ana)
    client.post("/dms/bia", json={"texto": "duas"}, headers=ana)

    resposta = client.get("/dms/nao-lidas", headers=bia)
    assert resposta.status_code == 200
    assert resposta.json() == {"total": 2, "por_conversa": {"ana": 2}}
    assert client.post("/dms/ana/lidas", headers=bia).json()["lidas_ate_id"] is None
    assert client.get("/dms/nao-lidas", headers=bia).json() == {
        "total": 0,
        "por_conversa": {},
    }


def test_marcar_lidas_grava_carimbo_na_mesma_resposta(client, pessoa):
    from app.db import SessionLocal
    from app.models.leitura_conversa import LeituraConversa
    from app.models.mensagem import Mensagem
    from app.models.user import User

    ana = pessoa("ana")
    bia = pessoa("bia")
    client.post("/dms/ana", json={"texto": "uma"}, headers=bia)
    client.post("/dms/ana", json={"texto": "duas"}, headers=bia)

    resposta = client.post("/dms/bia/lidas", headers=ana)

    assert resposta.status_code == 200
    with SessionLocal() as db:
        ana_user = db.scalar(select(User).where(User.username == "ana"))
        bia_user = db.scalar(select(User).where(User.username == "bia"))
        leitura = db.scalar(
            select(LeituraConversa).where(
                LeituraConversa.user_id == ana_user.id,
                LeituraConversa.com_id == bia_user.id,
            )
        )
        mensagens = list(
            db.scalars(
                select(Mensagem).where(
                    Mensagem.de_id == bia_user.id,
                    Mensagem.para_id == ana_user.id,
                )
            )
        )
        assert leitura is not None
        assert leitura.lida_em is not None
        assert len(mensagens) == 2
        assert all(mensagem.lida_em == leitura.lida_em for mensagem in mensagens)

    assert client.get("/dms/nao-lidas", headers=ana).json()["total"] == 0


def test_marcar_lidas_faz_um_commit_so(client, pessoa, monkeypatch):
    from sqlalchemy.orm import Session

    ana = pessoa("ana")
    pessoa("bia")
    commits = 0
    commit_original = Session.commit

    def contar_commit(self):
        nonlocal commits
        commits += 1
        return commit_original(self)

    monkeypatch.setattr(Session, "commit", contar_commit)

    assert client.post("/dms/bia/lidas", headers=ana).status_code == 200
    assert commits == 1

    commits = 0
    assert client.post("/dms/bia/lidas", headers=ana).status_code == 200
    assert commits == 1


def test_proposta_cria_conversa_e_conta_como_nao_lida(client, pessoa):
    from app.db import SessionLocal
    from app.models.habilidade import Habilidade
    from app.models.mensagem import Mensagem
    from app.models.troca import Troca

    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    with SessionLocal() as db:
        habilidade = db.scalar(select(Habilidade))
        assert habilidade is not None
        ana_id = int(ana["X-User-Id"])
        bia_id = int(bia["X-User-Id"])
        db.add(
            Troca(
                proposta_por_id=ana_id,
                com_id=bia_id,
                data_hora=datetime(2026, 11, 24, 18),
                habilidade_ensino_id=habilidade.id,
                criada_em=datetime(2026, 11, 23, 12),
            )
        )
        db.add_all(
            [
                Troca(
                    proposta_por_id=bia_id,
                    com_id=ana_id,
                    data_hora=datetime(2026, 11, 25, 18),
                    habilidade_ensino_id=habilidade.id,
                    criada_em=datetime(2026, 11, 23, 10),
                    status="confirmada",
                ),
                Troca(
                    proposta_por_id=bia_id,
                    com_id=ana_id,
                    data_hora=datetime(2026, 11, 26, 18),
                    habilidade_ensino_id=habilidade.id,
                    criada_em=datetime(2026, 11, 23, 11),
                    status="recusada",
                ),
                Mensagem(
                    de_id=int(caio["X-User-Id"]),
                    para_id=bia_id,
                    texto="mensagem posterior",
                    em=datetime(2026, 11, 23, 13),
                ),
            ]
        )
        db.commit()

    resposta = client.get("/dms", headers=bia)
    assert resposta.status_code == 200
    assert [item["com"]["username"] for item in resposta.json()["items"]] == [
        "caio",
        "ana",
    ]
    assert resposta.json()["items"][0]["ultimo_evento"] == "mensagem"
    item = resposta.json()["items"][1]
    assert item["com"]["username"] == "ana"
    assert item["ultimo_evento"] == "troca_proposta"
    assert item["ultima_mensagem"] == ""
    assert item["nao_lidas"] == 1
    assert client.get("/dms/nao-lidas", headers=bia).json() == {
        "total": 2,
        "por_conversa": {"caio": 1, "ana": 1},
    }
    assert client.post("/dms/ana/lidas", headers=bia).status_code == 200
    assert client.get("/dms/nao-lidas", headers=bia).json() == {
        "total": 1,
        "por_conversa": {"caio": 1},
    }
    assert client.get("/dms/nao-lidas", headers=ana).json()["total"] == 0


def test_nao_lidas_e_rota_estatica(client, pessoa):
    ana = pessoa("ana")
    resposta = client.get("/dms/nao-lidas", headers=ana)
    assert resposta.status_code == 200
    assert resposta.json() == {"total": 0, "por_conversa": {}}
