from sqlalchemy import select

from app.db import SessionLocal
from app.models.habilidade import Habilidade


def ids(*nomes: str) -> list[int]:
    with SessionLocal() as db:
        por_nome = {h.nome: h.id for h in db.scalars(select(Habilidade))}
    return [por_nome[n] for n in nomes]


def test_salvar_habilidades_aparece_no_perfil(client, logar):
    ana = logar("ana")
    react, calculo = ids("React", "Cálculo 1")
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[
            {"habilidade_id": react, "tipo": "sei", "nivel": 4},
            {"habilidade_id": calculo, "tipo": "quero_aprender", "nivel": 1},
        ],
        headers=ana,
    )
    assert r.status_code == 200
    assert {(h["nome"], h["tipo"], h["nivel"]) for h in r.json()} == {
        ("React", "sei", 4),
        ("Cálculo 1", "quero_aprender", 1),
    }
    perfil = client.get("/usuarios/ana").json()
    assert {h["nome"] for h in perfil["habilidades"]} == {"React", "Cálculo 1"}


def test_salvar_substitui_a_lista_inteira(client, logar):
    ana = logar("ana")
    react, python = ids("React", "Python")
    client.put("/usuarios/eu/habilidades", json=[{"habilidade_id": react, "tipo": "sei"}], headers=ana)
    r = client.put("/usuarios/eu/habilidades", json=[{"habilidade_id": python, "tipo": "sei"}], headers=ana)
    assert [h["nome"] for h in r.json()] == ["Python"]
    r = client.put("/usuarios/eu/habilidades", json=[], headers=ana)
    assert r.json() == []


def test_salvar_atualiza_os_matches_na_hora(client, logar):
    ana = logar("ana")
    bia = logar("bia")
    react, calculo = ids("React", "Cálculo 1")
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "sei"}, {"habilidade_id": calculo, "tipo": "quero_aprender"}],
        headers=ana,
    )
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": calculo, "tipo": "sei"}, {"habilidade_id": react, "tipo": "quero_aprender"}],
        headers=bia,
    )
    troca = client.get("/matches", headers=ana).json()["troca"]
    assert [m["usuario"]["username"] for m in troca] == ["bia"]

    client.put("/usuarios/eu/habilidades", json=[], headers=bia)
    assert client.get("/matches", headers=ana).json()["troca"] == []


def test_mesma_habilidade_em_sei_e_quero_e_recusada(client, logar):
    ana = logar("ana")
    (react,) = ids("React")
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "sei"}, {"habilidade_id": react, "tipo": "quero_aprender"}],
        headers=ana,
    )
    assert r.status_code == 422


def test_habilidade_fora_do_catalogo_e_nivel_invalido(client, logar):
    ana = logar("ana")
    (react,) = ids("React")
    assert client.put("/usuarios/eu/habilidades", json=[{"habilidade_id": 99999, "tipo": "sei"}], headers=ana).status_code == 422
    assert client.put("/usuarios/eu/habilidades", json=[{"habilidade_id": react, "tipo": "sei", "nivel": 6}], headers=ana).status_code == 422
    assert client.put("/usuarios/eu/habilidades", json=[{"habilidade_id": react, "tipo": "talvez"}], headers=ana).status_code == 422


def test_salvar_habilidades_exige_login(client):
    assert client.put("/usuarios/eu/habilidades", json=[]).status_code == 401


def test_busca_de_usuarios_por_nome_ou_username(client, logar):
    logar("ana_dev", "Ana Souza")
    logar("bruno", "Bruno Lima")
    logar("carla", "Carla Ana")
    r = client.get("/usuarios?q=ana")
    assert r.status_code == 200
    assert {u["username"] for u in r.json()["items"]} == {"ana_dev", "carla"}
    assert r.json()["total"] == 2
    assert client.get("/usuarios?q=%25").json()["total"] == 0
    assert client.get("/usuarios").json()["total"] == 3
