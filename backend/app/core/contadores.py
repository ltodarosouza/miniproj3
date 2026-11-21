"""Exemplo canônico do padrão core/: contador de usuários por inicial.

Python puro: nenhum import de SQLAlchemy/FastAPI aqui dentro. A API alimenta
esta estrutura com dados simples; ela só conhece strings e ints.

Não é feature de menu — é o molde que suas features imitam.
"""


class ContadorPorInicial:
    """dict letra -> quantos usernames começam com ela.

    - consultar/incrementar: O(1) (lookup em hash)
    - reconstruir do zero: O(n) — por isso só acontece no startup
    """

    def __init__(self) -> None:
        self._contagem: dict[str, int] = {}

    def reconstruir(self, usernames: list[str]) -> None:
        """Chamado no startup com todos os usernames do banco."""
        self._contagem = {}
        for u in usernames:
            self.incrementar(u)

    def incrementar(self, username: str) -> None:
        """Chamado pela API a cada usuário criado. O(1)."""
        inicial = username[0].lower()
        self._contagem[inicial] = self._contagem.get(inicial, 0) + 1

    def contagem(self) -> dict[str, int]:
        return dict(self._contagem)


# O singleton que a API importa (ver app/services/users.py e o lifespan em main.py).
contador_iniciais = ContadorPorInicial()
