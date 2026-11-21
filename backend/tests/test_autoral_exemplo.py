"""MODELO de teste escrito pelo time (guia 09) — sobre o slice de exemplo, de
propósito: não entrega nenhuma feature.

Um teste seu cobre um caso que o CONTRATO.md NÃO especifica. Receita de 3
perguntas (guia 09): e se vier duplicado/vazio? e sem permissão? e além do
limite? Um bom teste fica VERMELHO se a feature for quebrada.
"""


def test_autoral_offset_alem_do_total_devolve_vazio_e_nao_erro(client):
    # caso de borda: paginar além do fim não é erro — é lista vazia com total certo
    client.post("/usuarios", json={"username": "ana", "name": "Ana"})

    r = client.get("/usuarios?offset=50&limit=10")

    assert r.status_code == 200
    assert r.json()["items"] == []
    assert r.json()["total"] == 1
