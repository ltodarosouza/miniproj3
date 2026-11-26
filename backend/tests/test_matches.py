import threading
import time

from sqlalchemy import select

from app.core.matches import IndiceMatches, indice_matches
from app.db import SessionLocal
from app.models.habilidade import Habilidade
from app.models.user_habilidade import UserHabilidade


def marcar(headers, nome, tipo, nivel=1):
    usuario_id = int(headers["X-User-Id"])
    with SessionLocal() as db:
        habilidade_id = db.scalar(select(Habilidade.id).where(Habilidade.nome == nome))
        db.add(UserHabilidade(usuario_id=usuario_id, habilidade_id=habilidade_id, tipo=tipo, nivel=nivel))
        db.commit()
    indice_matches.adicionar(usuario_id, habilidade_id, tipo)


def usernames(grupo):
    return [m["usuario"]["username"] for m in grupo]


def test_indice_pode_me_ensinar_e_troca():
    indice = IndiceMatches()
    indice.reconstruir(
        [
            (1, 10, "quero_aprender"),
            (1, 20, "sei"),
            (2, 10, "sei"),
            (2, 20, "quero_aprender"),
            (3, 10, "sei"),
            (1, 10, "sei"),
        ]
    )
    assert indice.pode_me_ensinar(1) == {2, 3}
    assert indice.match_de_troca(1) == {2}

    indice.remover(2, 20, "quero_aprender")
    assert indice.match_de_troca(1) == set()
    assert indice.pode_me_ensinar(9) == set()


def test_matches_em_dois_niveis_e_ordem(client, pessoa):
    eu = pessoa("ana")
    bia = pessoa("bia", "Bia")
    caio = pessoa("caio", "Caio")
    davi = pessoa("davi", "Davi")
    pessoa("edu")

    marcar(eu, "Python", "sei", 4)
    marcar(eu, "React", "quero_aprender")
    marcar(eu, "Cálculo 1", "quero_aprender")

    marcar(bia, "React", "sei", 5)
    marcar(bia, "Python", "quero_aprender")
    marcar(caio, "React", "sei", 2)
    marcar(caio, "Cálculo 1", "sei", 3)
    marcar(davi, "Cálculo 1", "sei", 1)

    r = client.get("/matches", headers=eu)
    assert r.status_code == 200
    corpo = r.json()

    assert usernames(corpo["troca"]) == ["bia"]
    troca = corpo["troca"][0]
    assert [(h["nome"], h["nivel"]) for h in troca["me_ensina"]] == [("React", 5)]
    assert [(h["nome"], h["nivel"]) for h in troca["eu_ensino"]] == [("Python", 4)]

    assert usernames(corpo["pode_te_ensinar"]) == ["caio", "davi"]
    assert all(m["eu_ensino"] == [] for m in corpo["pode_te_ensinar"])


def test_sem_habilidades_devolve_vazio(client, pessoa):
    eu = pessoa("ana")
    assert client.get("/matches", headers=eu).json() == {"troca": [], "pode_te_ensinar": [], "em_andamento": []}


def test_matches_exige_login(client):
    assert client.get("/matches").status_code == 401


def test_ordem_por_quantidade_e_depois_alfabetica_sem_acento(client, pessoa):
    eu = pessoa("eus")
    zeca = pessoa("zeca", "Zeca")
    erica = pessoa("erica", "Érica")
    bruno = pessoa("bruno", "Bruno")
    marcar(eu, "React", "quero_aprender")
    marcar(eu, "Cálculo 1", "quero_aprender")

    marcar(zeca, "React", "sei")
    marcar(zeca, "Cálculo 1", "sei")
    marcar(erica, "React", "sei")
    marcar(bruno, "Cálculo 1", "sei")

    corpo = client.get("/matches", headers=eu).json()
    assert usernames(corpo["pode_te_ensinar"]) == ["zeca", "bruno", "erica"]


def test_desempate_alfabetico_na_troca(client, pessoa):
    eu = pessoa("eus")
    marcar(eu, "Python", "sei")
    marcar(eu, "React", "quero_aprender")
    for username, nome in [("zara", "Zara"), ("alice", "Álice"), ("caio", "caio")]:
        outra = pessoa(username, nome)
        marcar(outra, "React", "sei")
        marcar(outra, "Python", "quero_aprender")

    corpo = client.get("/matches", headers=eu).json()
    assert usernames(corpo["troca"]) == ["alice", "caio", "zara"]
    assert corpo["pode_te_ensinar"] == []


def test_eu_nunca_apareco_e_candidato_que_sabe_e_quer_o_mesmo(client, pessoa):
    eu = pessoa("eus")
    bia = pessoa("bia")
    marcar(eu, "React", "sei")
    marcar(eu, "React", "quero_aprender")
    marcar(bia, "React", "sei")
    marcar(bia, "React", "quero_aprender")

    corpo = client.get("/matches", headers=eu).json()
    assert usernames(corpo["troca"]) == ["bia"]
    assert [h["nome"] for h in corpo["troca"][0]["eu_ensino"]] == ["React"]
    assert "eus" not in usernames(corpo["troca"]) + usernames(corpo["pode_te_ensinar"])


def test_so_sei_e_nao_quero_nada_nao_tem_matches(client, pessoa):
    eu = pessoa("eus")
    bia = pessoa("bia")
    marcar(eu, "Python", "sei")
    marcar(bia, "Python", "quero_aprender")
    marcar(bia, "React", "sei")

    assert client.get("/matches", headers=eu).json() == {"troca": [], "pode_te_ensinar": [], "em_andamento": []}


def test_quem_ja_conversa_ou_tem_troca_vai_para_em_andamento(client, pessoa):
    eu = pessoa("ana")
    bia = pessoa("bia")
    caio = pessoa("caio")
    davi = pessoa("davi")
    marcar(eu, "Python", "sei")
    marcar(eu, "React", "quero_aprender")
    for outra in (bia, caio, davi):
        marcar(outra, "React", "sei")
    marcar(bia, "Python", "quero_aprender")

    client.post("/dms/bia", json={"texto": "oi"}, headers=eu)
    react = client.get("/habilidades").json()["items"]
    react_id = next(h["id"] for h in react if h["nome"] == "React")
    r = client.post(
        "/trocas",
        json={"com_username": "ana", "data_hora": "2030-01-10T10:00:00Z", "habilidade_ensino_id": react_id},
        headers=caio,
    )
    assert r.status_code == 201

    corpo = client.get("/matches", headers=eu).json()
    assert usernames(corpo["troca"]) == []
    assert usernames(corpo["pode_te_ensinar"]) == ["davi"]
    assert usernames(corpo["em_andamento"]) == ["bia", "caio"]


def test_troca_recusada_nao_conta_como_em_andamento(client, pessoa):
    eu = pessoa("ana")
    bia = pessoa("bia")
    marcar(eu, "React", "quero_aprender")
    marcar(bia, "React", "sei")
    react_id = next(h["id"] for h in client.get("/habilidades").json()["items"] if h["nome"] == "React")
    troca = client.post(
        "/trocas",
        json={"com_username": "bia", "data_hora": "2030-01-10T10:00:00Z", "habilidade_aprendo_id": react_id},
        headers=eu,
    ).json()
    client.post(f"/trocas/{troca['id']}/recusar", headers=bia)

    corpo = client.get("/matches", headers=eu).json()
    assert usernames(corpo["pode_te_ensinar"]) == ["bia"]
    assert corpo["em_andamento"] == []


def test_salvar_habilidades_em_paralelo_mantem_indice_igual_ao_banco(
    client, pessoa, monkeypatch
):
    from app.models.user import User
    from app.schemas.user import HabilidadeItem
    from app.services import users

    headers = pessoa("ana")
    usuario_id = int(headers["X-User-Id"])
    nomes = ["Python", "React", "Cálculo 1", "JavaScript"]
    with SessionLocal() as db:
        ids = {
            nome: db.scalar(select(Habilidade.id).where(Habilidade.nome == nome))
            for nome in nomes
        }

    inicial = [HabilidadeItem(habilidade_id=ids["React"], tipo="sei")]
    lista_a = [
        HabilidadeItem(habilidade_id=ids["Python"], tipo="sei"),
        HabilidadeItem(habilidade_id=ids["React"], tipo="quero_aprender"),
    ]
    lista_b = [
        HabilidadeItem(habilidade_id=ids["Cálculo 1"], tipo="sei"),
        HabilidadeItem(habilidade_id=ids["JavaScript"], tipo="quero_aprender"),
    ]
    with SessionLocal() as db:
        usuario = db.get(User, usuario_id)
        users.salvar_habilidades(db, usuario, inicial)

    remover_original = indice_matches.remover

    def remover_lento(*args):
        time.sleep(0.05)
        remover_original(*args)

    monkeypatch.setattr(indice_matches, "remover", remover_lento)
    barreira = threading.Barrier(2)
    erros = []

    def salvar(itens):
        try:
            with SessionLocal() as db:
                usuario = db.get(User, usuario_id)
                barreira.wait()
                users.salvar_habilidades(db, usuario, itens)
        except Exception as erro:
            erros.append(erro)

    threads = [threading.Thread(target=salvar, args=(itens,)) for itens in (lista_a, lista_b)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert erros == []
    with SessionLocal() as db:
        banco = {
            (relacao.habilidade_id, relacao.tipo)
            for relacao in db.scalars(
                select(UserHabilidade).where(UserHabilidade.usuario_id == usuario_id)
            )
        }
    sei = {habilidade_id for habilidade_id, tipo in banco if tipo == "sei"}
    quero = {
        habilidade_id for habilidade_id, tipo in banco if tipo == "quero_aprender"
    }
    assert banco in (
        {(item.habilidade_id, item.tipo) for item in lista_a},
        {(item.habilidade_id, item.tipo) for item in lista_b},
    )
    assert indice_matches.habilidades_que_sei(usuario_id) == sei
    assert indice_matches.habilidades_que_quero(usuario_id) == quero
