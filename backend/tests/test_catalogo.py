import unicodedata

from app.core.catalogo import TrieDeHabilidades, trie_habilidades


def _sem_acento(texto: str) -> str:
    decomposto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in decomposto if not unicodedata.combining(c)).casefold()


def test_trie_busca_por_prefixo():
    trie = TrieDeHabilidades()
    trie.reconstruir([(1, "Python"), (2, "PostgreSQL"), (3, "Pandas"), (4, "JavaScript")])

    assert trie.buscar("py") == [(1, "Python")]
    assert trie.buscar("p") == [(3, "Pandas"), (2, "PostgreSQL"), (1, "Python")]
    assert trie.buscar("java") == [(4, "JavaScript")]
    assert trie.buscar("xyz") == []


def test_trie_casefold_e_sem_acento():
    trie = TrieDeHabilidades()
    trie.reconstruir([(1, "Cálculo 1"), (2, "Álgebra Linear")])

    assert trie.buscar("cal") == [(1, "Cálculo 1")]
    assert trie.buscar("ALG") == [(2, "Álgebra Linear")]


def test_trie_respeita_limite():
    trie = TrieDeHabilidades()
    trie.reconstruir([(i, f"Item {i}") for i in range(20)])
    assert len(trie.buscar("item", limite=10)) == 10


def test_trie_reconstruir_substituicao():
    trie = TrieDeHabilidades()
    trie.reconstruir([(1, "Python")])
    trie.reconstruir([(2, "Java")])
    assert trie.buscar("py") == []
    assert trie.buscar("ja") == [(2, "Java")]


def test_autocomplete_via_api(client):
    r = client.get("/habilidades/autocomplete?prefixo=python")
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert items[0]["nome"] == "Python"


def test_autocomplete_casefold(client):
    r = client.get("/habilidades/autocomplete?prefixo=REACT")
    assert r.status_code == 200
    assert [h["nome"] for h in r.json()["items"]] == ["React"]


def test_autocomplete_limite_e_ordem_alfabetica(client):
    r = client.get("/habilidades/autocomplete?prefixo=c")
    assert r.status_code == 200
    nomes = [h["nome"] for h in r.json()["items"]]
    assert "C" in nomes
    assert "C++" in nomes
    assert "C#" in nomes
    assert "Cálculo 1" in nomes
    assert len(nomes) <= 10
    assert nomes == sorted(nomes, key=_sem_acento)


def test_mapear_habilidade_existente(client):
    r = client.post("/habilidades/mapear", json={"texto": "pyton"})
    assert r.status_code == 200
    assert r.json()["habilidade"]["nome"] == "Python"


def test_mapear_habilidade_inexistente(client):
    r = client.post("/habilidades/mapear", json={"texto": "cozinhar batatas fritas"})
    assert r.status_code == 200
    assert r.json()["habilidade"] is None


def test_atualizar_habilidades_do_usuario(client, logar):
    ana = logar("ana", "Ana")

    python = client.get("/habilidades/autocomplete?prefixo=python").json()["items"][0]
    react = client.get("/habilidades/autocomplete?prefixo=react").json()["items"][0]

    r = client.put(
        "/usuarios/eu/habilidades",
        json=[
            {"habilidade_id": python["id"], "tipo": "sei", "nivel": 4},
            {"habilidade_id": react["id"], "tipo": "quero_aprender", "nivel": 2},
        ],
        headers=ana,
    )
    assert r.status_code == 200

    habilidades = r.json()
    assert len(habilidades) == 2
    assert any(h["nome"] == "Python" and h["tipo"] == "sei" and h["nivel"] == 4 for h in habilidades)
    assert any(h["nome"] == "React" and h["tipo"] == "quero_aprender" for h in habilidades)


def test_atualizar_habilidades_substituicao(client, logar):
    ana = logar("ana", "Ana")

    python = client.get("/habilidades/autocomplete?prefixo=python").json()["items"][0]
    client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": python["id"], "tipo": "sei", "nivel": 4}],
        headers=ana,
    )

    r = client.put(
        "/usuarios/eu/habilidades",
        json=[],
        headers=ana,
    )
    assert r.status_code == 200
    assert r.json() == []


def test_atualizar_habilidades_invalida_da_422(client, logar):
    ana = logar("ana", "Ana")

    r = client.put(
        "/usuarios/eu/habilidades",
        json=[{"habilidade_id": 99999, "tipo": "sei", "nivel": 4}],
        headers=ana,
    )
    assert r.status_code == 422


def test_atualizar_habilidades_exige_login(client):
    r = client.put("/usuarios/eu/habilidades", json=[])
    assert r.status_code == 401


def test_singleton_trie_carregado_no_lifespan(client):
    r = client.get("/habilidades/autocomplete?prefixo=python")
    assert r.status_code == 200
    assert trie_habilidades.nome_de(r.json()["items"][0]["id"]) == "Python"
