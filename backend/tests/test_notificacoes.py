from datetime import timedelta

from sqlalchemy import select

from app.core.tempo import agora_utc
from app.db import SessionLocal
from app.models.curtida import Curtida
from app.models.leitura_notificacoes import LeituraNotificacoes
from app.models.troca import Troca
from app.models.user import User


def habilidades(client):
    items = client.get("/habilidades").json()["items"]
    return {item["nome"]: item["id"] for item in items}


def criar_troca(client, headers, ids, com="bia"):
    resposta = client.post(
        "/trocas",
        json={
            "com_username": com,
            "data_hora": "2030-01-10T10:00:00Z",
            "link_meet": "https://meet.google.com/abc-defg-hij",
            "habilidade_ensino_id": ids["React"],
            "habilidade_aprendo_id": ids["Cálculo 1"],
        },
        headers=headers,
    )
    assert resposta.status_code == 201
    return resposta.json()["id"]


def test_curtida_aparece_somente_para_autor_do_post(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    client.post(f"/posts/{post_id}/curtir", headers=bia)

    para_ana = client.get("/notificacoes", headers=ana).json()
    assert para_ana["total"] == 1
    assert para_ana["items"][0]["tipo"] == "curtida"
    assert para_ana["items"][0]["ator"]["username"] == "bia"
    assert para_ana["items"][0]["post_id"] == post_id
    assert para_ana["items"][0]["texto_curto"] == "Bia curtiu seu post"
    assert client.get("/notificacoes", headers=bia).json()["total"] == 0


def test_curtidas_no_mesmo_dia_sao_agrupadas(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    duda = pessoa("duda")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    for headers in (bia, caio, duda):
        client.post(f"/posts/{post_id}/curtir", headers=headers)

    itens = client.get("/notificacoes", headers=ana).json()["items"]
    assert len(itens) == 1
    assert itens[0]["texto_curto"] == "Duda e mais 2 curtiram seu post"
    assert itens[0]["ator"]["username"] == "duda"


def test_nao_lidas_informa_ultima_notificacao_agrupada(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    assert client.get("/notificacoes/nao-lidas", headers=ana).json()["ultima_em"] is None
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/curtir", headers=bia)
    primeira = client.get("/notificacoes/nao-lidas", headers=ana).json()
    with SessionLocal() as db:
        curtida = db.scalar(select(Curtida).where(Curtida.post_id == post_id))
        curtida.created_at = curtida.created_at - timedelta(seconds=10)
        db.commit()
    client.post(f"/posts/{post_id}/curtir", headers=caio)
    ultima = client.get("/notificacoes/nao-lidas", headers=ana).json()
    assert primeira["total"] == ultima["total"] == 1
    assert ultima["ultima_em"] > primeira["ultima_em"]


def test_acoes_no_proprio_post_nao_notificam(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "meu"}, headers=ana).json()["id"]

    client.post(f"/posts/{post_id}/curtir", headers=ana)
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "eu"}, headers=ana)

    assert client.get("/notificacoes", headers=ana).json()["total"] == 0


def test_comentario_notifica_autor_do_post(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    client.post(f"/posts/{post_id}/comentarios", json={"texto": "boa"}, headers=bia)

    item = client.get("/notificacoes", headers=ana).json()["items"][0]
    assert item["tipo"] == "comentario"
    assert item["ator"]["username"] == "bia"
    assert item["post_id"] == post_id
    assert item["texto_curto"] == "Bia comentou no seu post"


def test_seguir_notifica_quem_foi_seguido(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")

    client.post("/usuarios/ana/follow", headers=bia)

    item = client.get("/notificacoes", headers=ana).json()["items"][0]
    assert item["tipo"] == "seguidor"
    assert item["ator"]["username"] == "bia"
    assert item["texto_curto"] == "Bia começou a seguir você"


def test_proposta_confirmacao_e_recusa_notificam_participantes_certos(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    ids = habilidades(client)
    confirmada = criar_troca(client, ana, ids)
    recusada = criar_troca(client, caio, ids, "bia")

    proposta_bia = client.get("/notificacoes", headers=bia).json()["items"]
    assert len(proposta_bia) == 2
    assert all(item["tipo"] == "troca_proposta" for item in proposta_bia)
    assert {item["troca_id"] for item in proposta_bia} == {confirmada, recusada}
    assert client.get("/notificacoes", headers=ana).json()["total"] == 0

    assert client.post(f"/trocas/{confirmada}/confirmar", headers=bia).status_code == 200
    assert client.post(f"/trocas/{recusada}/recusar", headers=bia).status_code == 200
    itens_ana = client.get("/notificacoes", headers=ana).json()["items"]
    itens_caio = client.get("/notificacoes", headers=caio).json()["items"]
    assert any(i["tipo"] == "troca_confirmada" and i["troca_id"] == confirmada for i in itens_ana)
    assert any(i["tipo"] == "troca_recusada" and i["troca_id"] == recusada for i in itens_caio)


def test_avaliacao_notifica_pessoa_avaliada(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    ids = habilidades(client)
    troca_id = criar_troca(client, ana, ids)
    client.post(f"/trocas/{troca_id}/confirmar", headers=bia)
    with SessionLocal() as db:
        db.get(Troca, troca_id).data_hora = agora_utc() - timedelta(hours=2)
        db.commit()

    resposta = client.post(
        f"/trocas/{troca_id}/avaliar",
        json={"estrelas": 5, "feedback": "Boa troca"},
        headers=ana,
    )

    assert resposta.status_code == 201
    item = client.get("/notificacoes", headers=bia).json()["items"][0]
    assert item["tipo"] == "avaliacao"
    assert item["ator"]["username"] == "ana"
    assert item["troca_id"] == troca_id
    assert item["texto_curto"] == "Ana avaliou a troca com você"


def test_marcar_lidas_atualiza_contagem_e_novas_acoes(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_id}/curtir", headers=bia)

    assert client.get("/notificacoes/nao-lidas", headers=ana).json()["total"] == 1
    assert client.post("/notificacoes/lidas", headers=ana).status_code == 204
    assert client.get("/notificacoes/nao-lidas", headers=ana).json()["total"] == 0
    assert client.post("/notificacoes/lidas", headers=ana).status_code == 204
    assert client.get("/notificacoes", headers=ana).json()["items"][0]["lida"] is True
    client.post(f"/posts/{post_id}/comentarios", json={"texto": "novo"}, headers=bia)
    assert client.get("/notificacoes/nao-lidas", headers=ana).json()["total"] == 1
    assert client.get("/notificacoes", headers=ana).json()["items"][0]["lida"] is False


def test_marcar_lidas_nao_retrocede_marcador_futuro(client, pessoa):
    ana = pessoa("ana")
    futuro = agora_utc() + timedelta(hours=1)
    with SessionLocal() as db:
        usuario = db.scalar(select(User).where(User.username == "ana"))
        leitura = LeituraNotificacoes(usuario_id=usuario.id, lidas_ate=futuro)
        db.add(leitura)
        db.commit()

    assert client.post("/notificacoes/lidas", headers=ana).status_code == 204

    with SessionLocal() as db:
        usuario = db.scalar(select(User).where(User.username == "ana"))
        leitura = db.scalar(
            select(LeituraNotificacoes).where(
                LeituraNotificacoes.usuario_id == usuario.id
            )
        )
        assert leitura.lidas_ate == futuro


def test_ordem_decrescente_paginacao_e_total(client, pessoa):
    ana = pessoa("ana")
    for username in ("bia", "caio", "duda"):
        ator = pessoa(username)
        client.post(f"/usuarios/ana/follow", headers=ator)

    primeira = client.get("/notificacoes?limit=2", headers=ana).json()
    segunda = client.get("/notificacoes?offset=2&limit=2", headers=ana).json()
    assert primeira["total"] == segunda["total"] == 3
    assert len(primeira["items"]) == 2
    assert len(segunda["items"]) == 1
    datas = [item["em"] for item in client.get("/notificacoes", headers=ana).json()["items"]]
    assert datas == sorted(datas, reverse=True)


def test_endpoints_exigem_login(client):
    assert client.get("/notificacoes").status_code == 401
    assert client.get("/notificacoes/nao-lidas").status_code == 401
    assert client.post("/notificacoes/lidas").status_code == 401
