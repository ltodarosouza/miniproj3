from collections import deque
from threading import Lock
import time


class LimitadorDeTaxa:
    def __init__(self, max_chamadas: int, janela_segundos: float):
        self.max_chamadas = max_chamadas
        self.janela_segundos = janela_segundos
        self._chamadas: dict[object, deque[float]] = {}
        self._lock = Lock()

    def permitir(self, chave: object) -> bool:
        agora = time.monotonic()
        with self._lock:
            chamadas = self._chamadas.setdefault(chave, deque())
            while chamadas and agora - chamadas[0] >= self.janela_segundos:
                chamadas.popleft()
            if len(chamadas) >= self.max_chamadas:
                return False
            chamadas.append(agora)
            return True

    def limpar(self) -> None:
        with self._lock:
            self._chamadas.clear()


limitador_mapear = LimitadorDeTaxa(20, 60)
