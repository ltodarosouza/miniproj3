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
    assert indice.quem_pode_ensinar(1) == {2, 3}

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
    assert troca["me_ensina"] == [{"id": troca["me_ensina"][0]["id"], "nome": "React", "nivel": 5}]
    assert [(h["nome"], h["nivel"]) for h in troca["eu_ensino"]] == [("Python", 4)]

    assert usernames(corpo["pode_te_ensinar"]) == ["caio", "davi"]
    assert all(m["eu_ensino"] == [] for m in corpo["pode_te_ensinar"])


def test_sem_habilidades_devolve_vazio(client, pessoa):
    eu = pessoa("ana")
    assert client.get("/matches", headers=eu).json() == {"troca": [], "pode_te_ensinar": []}


def test_matches_exige_login(client):
    assert client.get("/matches").status_code == 401
