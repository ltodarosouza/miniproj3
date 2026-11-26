import base64
import json
from datetime import timedelta, timezone

from sqlalchemy import select

from app.core.tempo import agora_utc
from app.db import SessionLocal
from app.models.curtida import Curtida
from app.models.follow import Follow
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


def horario_utc(hora, minuto=0):
    return (agora_utc() - timedelta(days=1)).replace(
        hour=hora, minute=minuto, second=0, microsecond=0
    )


def identidade(item):
    return (
        item["tipo"], item["ator"]["username"], item.get("post_id"),
        item.get("troca_id"),
    )


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
    assert primeira["proximo_cursor"]
    assert segunda["proximo_cursor"] is None
    datas = [item["em"] for item in client.get("/notificacoes", headers=ana).json()["items"]]
    assert datas == sorted(datas, reverse=True)


def test_cursor_sem_sobreposicao_com_evento_novo_entre_paginas(client, pessoa):
    ana = pessoa("ana")
    nomes = [f"seguidor{i}" for i in range(13)]
    for nome in nomes:
        client.post("/usuarios/ana/follow", headers=pessoa(nome))
    with SessionLocal() as db:
        follows = list(db.scalars(select(Follow).join(User, Follow.seguidor_id == User.id).where(User.username.in_(nomes))))
        for i, follow in enumerate(follows):
            follow.em = horario_utc(10, i)
        db.commit()

    pagina = client.get("/notificacoes?limit=5", headers=ana).json()
    originais = list(pagina["items"])
    cursor = pagina["proximo_cursor"]
    novo = pessoa("novo")
    client.post("/usuarios/ana/follow", headers=novo)
    paginas_com_cursor = []
    while cursor:
        pagina = client.get(f"/notificacoes?limit=5&cursor={cursor}", headers=ana).json()
        paginas_com_cursor.extend(pagina["items"])
        cursor = pagina["proximo_cursor"]
    assert pagina["proximo_cursor"] is None
    todas = originais + paginas_com_cursor
    identidades = [identidade(item) for item in todas]
    assert len(identidades) == len(set(identidades)) == 13
    assert {item["ator"]["username"] for item in todas} == set(nomes)
    assert all(item["ator"]["username"] != "novo" for item in paginas_com_cursor)
    primeira_nova = client.get("/notificacoes?limit=5", headers=ana).json()
    assert primeira_nova["items"][0]["ator"]["username"] == "novo"


def test_cursor_mantem_grupo_de_post_nao_exibido_que_recebe_curtida_nova(client, pessoa):
    ana, bia, caio = pessoa("ana"), pessoa("bia"), pessoa("caio")
    post_a = client.post("/posts", json={"texto": "A"}, headers=ana).json()["id"]
    post_b = client.post("/posts", json={"texto": "B"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_a}/curtir", headers=bia)
    client.post(f"/posts/{post_b}/curtir", headers=bia)
    with SessionLocal() as db:
        curtidas = list(db.scalars(select(Curtida).order_by(Curtida.post_id)))
        for curtida in curtidas:
            curtida.created_at = horario_utc(10, 0 if curtida.post_id == post_a else 1)
        db.commit()
    primeira = client.get("/notificacoes?limit=1", headers=ana).json()
    assert primeira["items"][0]["post_id"] == post_b
    client.post(f"/posts/{post_a}/curtir", headers=caio)
    segunda = client.get(f"/notificacoes?limit=1&cursor={primeira['proximo_cursor']}", headers=ana).json()
    item = segunda["items"][0]
    assert item["post_id"] == post_a
    assert item["em"] == horario_utc(10).isoformat() + "Z"
    assert item["ator"]["username"] == "bia"
    assert item["texto_curto"] == "Bia curtiu seu post"
    assert segunda["proximo_cursor"] is None


def test_cursor_nao_repete_grupo_ja_exibido(client, pessoa):
    ana, bia, caio, duda = (pessoa(n) for n in ("ana", "bia", "caio", "duda"))
    post_a = client.post("/posts", json={"texto": "A"}, headers=ana).json()["id"]
    post_b = client.post("/posts", json={"texto": "B"}, headers=ana).json()["id"]
    for post_id, ator in ((post_a, bia), (post_a, caio), (post_b, duda)):
        client.post(f"/posts/{post_id}/curtir", headers=ator)
    with SessionLocal() as db:
        curtidas = list(db.scalars(select(Curtida)))
        minutos = {post_a: {"bia": 0, "caio": 5}, post_b: {"duda": 3}}
        for curtida in curtidas:
            username = db.get(User, curtida.usuario_id).username
            curtida.created_at = horario_utc(10, minutos[curtida.post_id][username])
        db.commit()
    primeira = client.get("/notificacoes?limit=1", headers=ana).json()
    assert primeira["items"][0]["post_id"] == post_a
    assert primeira["items"][0]["texto_curto"] == "Caio e mais 1 curtiram seu post"
    segunda = client.get(f"/notificacoes?limit=1&cursor={primeira['proximo_cursor']}", headers=ana).json()
    assert [item["post_id"] for item in segunda["items"]] == [post_b]
    assert segunda["proximo_cursor"] is None


def test_antes_de_recorta_curtidas_antes_de_agrupar(client, pessoa):
    ana, bia = pessoa("ana"), pessoa("bia")
    post_a = client.post("/posts", json={"texto": "A"}, headers=ana).json()["id"]
    post_b = client.post("/posts", json={"texto": "B"}, headers=ana).json()["id"]
    client.post(f"/posts/{post_a}/curtir", headers=bia)
    client.post(f"/posts/{post_b}/curtir", headers=bia)
    with SessionLocal() as db:
        curtidas = list(db.scalars(select(Curtida)))
        for curtida in curtidas:
            curtida.created_at = horario_utc(10, 0 if curtida.post_id == post_a else 1)
        db.commit()
    limite = horario_utc(10, 1).replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    resposta = client.get(f"/notificacoes?antes_de={limite}", headers=ana).json()
    assert [item["post_id"] for item in resposta["items"]] == [post_a]
    assert resposta["items"][0]["em"] == horario_utc(10).isoformat() + "Z"
    assert resposta["offset"] == 0


def test_cursor_desempata_eventos_no_mesmo_instante(client, pessoa):
    ana = pessoa("ana")
    for nome in ("bia", "caio", "duda"):
        client.post("/usuarios/ana/follow", headers=pessoa(nome))
    with SessionLocal() as db:
        instante = horario_utc(10)
        for follow in db.scalars(select(Follow)):
            follow.em = instante
        db.commit()
    vistos = []
    pagina = client.get("/notificacoes?limit=1", headers=ana).json()
    vistos.extend(pagina["items"])
    while pagina["proximo_cursor"]:
        pagina = client.get(f"/notificacoes?limit=1&cursor={pagina['proximo_cursor']}", headers=ana).json()
        vistos.extend(pagina["items"])
    assert len(vistos) == 3
    assert len({identidade(item) for item in vistos}) == 3
    assert pagina["proximo_cursor"] is None


def test_cursor_invalido_e_combinado_com_antes_de_dao_422(client, pessoa):
    ana = pessoa("ana")
    assert client.get("/notificacoes?cursor=abc", headers=ana).status_code == 422
    incompleto = base64.urlsafe_b64encode(json.dumps({"r": "x"}).encode()).decode().rstrip("=")
    assert client.get(f"/notificacoes?cursor={incompleto}", headers=ana).status_code == 422
    for username in ("bia", "caio"):
        client.post("/usuarios/ana/follow", headers=pessoa(username))
    valido = client.get("/notificacoes?limit=1", headers=ana).json()["proximo_cursor"]
    assert valido
    assert client.get(f"/notificacoes?cursor={valido}&antes_de=2030-01-01T00:00:00Z", headers=ana).status_code == 422


def test_endpoints_exigem_login(client):
    assert client.get("/notificacoes").status_code == 401
    assert client.get("/notificacoes/nao-lidas").status_code == 401
    assert client.post("/notificacoes/lidas").status_code == 401
