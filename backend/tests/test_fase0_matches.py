from app.core.matches import IndiceMatches, indice_matches


def test_reconstruir_substitui_estado_e_separa_tipos():
    indice = IndiceMatches()
    indice.adicionar(9, 90, "sei")

    indice.reconstruir([(1, 10, "sei"), (2, 10, "quero_aprender"), (3, 20, "sei")])

    assert indice.sabem == {10: {1}, 20: {3}}
    assert indice.querem == {10: {2}}


def test_adicionar_e_remover_atualizam_os_dicts():
    indice = IndiceMatches()
    indice.adicionar(1, 10, "sei")
    indice.adicionar(2, 10, "sei")
    indice.adicionar(3, 20, "quero_aprender")

    indice.remover(1, 10, "sei")
    indice.remover(4, 10, "sei")
    indice.remover(3, 20, "quero_aprender")

    assert indice.sabem == {10: {2}}
    assert indice.querem == {}


def test_quem_pode_ensinar_devolve_set():
    assert IndiceMatches().quem_pode_ensinar(1) == set()


def test_singleton_e_instancia_de_indice_matches():
    assert isinstance(indice_matches, IndiceMatches)
