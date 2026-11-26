class IndiceMatches:
    def __init__(self) -> None:
        self.sabem: dict[int, set[int]] = {}
        self.querem: dict[int, set[int]] = {}
        self._sei: dict[int, set[int]] = {}
        self._quero: dict[int, set[int]] = {}

    def reconstruir(self, registros: list[tuple[int, int, str]]) -> None:
        self.sabem = {}
        self.querem = {}
        self._sei = {}
        self._quero = {}
        for usuario_id, habilidade_id, tipo in registros:
            self.adicionar(usuario_id, habilidade_id, tipo)

    def _indices(self, tipo: str) -> tuple[dict[int, set[int]], dict[int, set[int]]]:
        if tipo == "sei":
            return self.sabem, self._sei
        return self.querem, self._quero

    def adicionar(self, usuario_id: int, habilidade_id: int, tipo: str) -> None:
        por_habilidade, por_usuario = self._indices(tipo)
        por_habilidade.setdefault(habilidade_id, set()).add(usuario_id)
        por_usuario.setdefault(usuario_id, set()).add(habilidade_id)

    def remover(self, usuario_id: int, habilidade_id: int, tipo: str) -> None:
        por_habilidade, por_usuario = self._indices(tipo)
        _descartar(por_habilidade, habilidade_id, usuario_id)
        _descartar(por_usuario, usuario_id, habilidade_id)

    def habilidades_que_sei(self, usuario_id: int) -> set[int]:
        return set(self._sei.get(usuario_id, ()))

    def habilidades_que_quero(self, usuario_id: int) -> set[int]:
        return set(self._quero.get(usuario_id, ()))

    def pode_me_ensinar(self, eu: int) -> set[int]:
        candidatos: set[int] = set()
        for habilidade_id in self._quero.get(eu, ()):
            candidatos |= self.sabem.get(habilidade_id, set())
        candidatos.discard(eu)
        return candidatos

    def match_de_troca(self, eu: int) -> set[int]:
        querem_o_que_sei: set[int] = set()
        for habilidade_id in self._sei.get(eu, ()):
            querem_o_que_sei |= self.querem.get(habilidade_id, set())
        return self.pode_me_ensinar(eu) & querem_o_que_sei


def _descartar(indice: dict[int, set[int]], chave: int, valor: int) -> None:
    conjunto = indice.get(chave)
    if conjunto is None:
        return
    conjunto.discard(valor)
    if not conjunto:
        del indice[chave]


indice_matches = IndiceMatches()
