from sqlalchemy import select

from app.db import SessionLocal
from app.models.habilidade import Habilidade
from app.schemas.user import UserOut


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


def test_mesma_habilidade_pode_estar_em_sei_e_em_quero_aprender(client, logar):
    ana = logar("ana")
    (react,) = ids("React")
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[
            {"habilidade_id": react, "tipo": "sei", "nivel": 3},
            {"habilidade_id": react, "tipo": "quero_aprender", "nivel": 5},
        ],
        headers=ana,
    )
    assert r.status_code == 200
    assert {(h["tipo"], h["nivel"]) for h in r.json()} == {("sei", 3), ("quero_aprender", 5)}
    perfil = client.get("/usuarios/ana").json()
    assert [h["nome"] for h in perfil["habilidades"]] == ["React", "React"]


def test_repetir_a_habilidade_na_mesma_lista_e_recusado(client, logar):
    ana = logar("ana")
    (react,) = ids("React")
    r = client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "sei"}, {"habilidade_id": react, "tipo": "sei", "nivel": 2}],
        headers=ana,
    )
    assert r.status_code == 422


def test_habilidade_nos_dois_lados_nao_gera_match_comigo_mesma(client, logar):
    ana = logar("ana")
    (react,) = ids("React")
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "sei"}, {"habilidade_id": react, "tipo": "quero_aprender"}],
        headers=ana,
    )
    assert client.get("/matches", headers=ana).json() == {
        "troca": [],
        "pode_te_ensinar": [],
        "em_andamento": [],
    }


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


def test_lista_de_usuarios_inclui_habilidades_da_pagina_sem_alterar_user_out(client, logar):
    alfa = logar("alfa_dev", "Alfa")
    beta = logar("beta_dev", "Beta")
    logar("charlie_dev", "Charlie")
    logar("delta", "Delta")
    react, python = ids("React", "Python")
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "sei", "nivel": 4}],
        headers=alfa,
    )
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": python, "tipo": "quero_aprender", "nivel": 2}],
        headers=beta,
    )

    pagina = client.get("/usuarios?q=dev&offset=1&limit=2").json()
    assert pagina["total"] == 3
    assert [item["username"] for item in pagina["items"]] == [
        "beta_dev",
        "charlie_dev",
    ]
    assert pagina["items"][0]["habilidades"] == [
        {
            "id": python,
            "nome": "Python",
            "categoria": "tech",
            "tipo": "quero_aprender",
            "nivel": 2,
        }
    ]
    assert pagina["items"][1]["habilidades"] == []

    primeira = client.get("/usuarios?q=dev&limit=1").json()
    assert primeira["items"][0]["habilidades"][0]["nome"] == "React"

    resposta_eu = client.get("/auth/eu", headers=beta)
    assert resposta_eu.status_code == 200
    assert set(resposta_eu.json()) == set(UserOut.model_fields)
    assert set(UserOut.model_fields) == {
        "id",
        "username",
        "name",
        "bio",
        "avatar_url",
        "created_at",
    }


def test_habilidade_nos_dois_tipos_aparece_em_ambas_as_listas_no_perfil(client, logar):
    """Mesma habilidade em sei e quero_aprender aparece nas duas seções do perfil."""
    ana = logar("ana")
    (python,) = ids("Python")
    client.put(
        "/usuarios/eu/habilidades",
        json=[
            {"habilidade_id": python, "tipo": "sei", "nivel": 2},
            {"habilidade_id": python, "tipo": "quero_aprender", "nivel": 5},
        ],
        headers=ana,
    )
    perfil = client.get("/usuarios/ana").json()
    tipos = {h["tipo"] for h in perfil["habilidades"] if h["nome"] == "Python"}
    assert tipos == {"sei", "quero_aprender"}


def test_habilidade_nos_dois_tipos_gera_match_com_outra_pessoa(client, logar):
    """Ana sabe React (sei) e quer aprender React (quero_aprender).
    Bia quer aprender React. Ana aparece como 'pode_te_ensinar' de Bia,
    mas Bia não aparece como match de troca de Ana (Bia não sabe nada que Ana queira)."""
    ana = logar("ana")
    bia = logar("bia")
    (react,) = ids("React")
    client.put(
        "/usuarios/eu/habilidades",
        json=[
            {"habilidade_id": react, "tipo": "sei", "nivel": 3},
            {"habilidade_id": react, "tipo": "quero_aprender", "nivel": 5},
        ],
        headers=ana,
    )
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": react, "tipo": "quero_aprender", "nivel": 1}],
        headers=bia,
    )
    matches_bia = client.get("/matches", headers=bia).json()
    assert any(m["usuario"]["username"] == "ana" for m in matches_bia["pode_te_ensinar"])
    assert client.get("/matches", headers=ana).json()["troca"] == []
