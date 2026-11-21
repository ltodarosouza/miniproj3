class IndiceMatches:
    def __init__(self) -> None:
        self.sabem: dict[int, set[int]] = {}
        self.querem: dict[int, set[int]] = {}

    def reconstruir(self, registros: list[tuple[int, int, str]]) -> None:
        self.sabem = {}
        self.querem = {}
        for usuario_id, habilidade_id, tipo in registros:
            self.adicionar(usuario_id, habilidade_id, tipo)

    def adicionar(self, usuario_id: int, habilidade_id: int, tipo: str) -> None:
        indice = self.sabem if tipo == "sei" else self.querem
        indice.setdefault(habilidade_id, set()).add(usuario_id)

    def remover(self, usuario_id: int, habilidade_id: int, tipo: str) -> None:
        indice = self.sabem if tipo == "sei" else self.querem
        usuarios = indice.get(habilidade_id)
        if usuarios is None:
            return
        usuarios.discard(usuario_id)
        if not usuarios:
            del indice[habilidade_id]

    def quem_pode_ensinar(self, usuario_id: int) -> set[int]:
        return set()


indice_matches = IndiceMatches()
