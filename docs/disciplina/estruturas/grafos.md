# Grafos + BFS

## A ideia em 1 parágrafo

Um grafo é um conjunto de coisas (nós) e conexões entre elas (arestas). Você já
conhece a peça que o representa: um **dict de sets**. Cada chave é um nó, e o
set guarda os vizinhos diretos. O grafo responde a perguntas como "dá para
chegar de A até B? Em quantos passos? Por qual caminho?". Quem responde é a BFS
(busca em largura), um loop com a `deque` que você já usa. Ela visita quem está
a 1 passo de distância, depois quem está a 2 passos, e assim por diante.

Exemplo deste guia (de propósito, fora do catálogo): cidades e rotas de ônibus.

```
  Recife ──── Caruaru ──── Arcoverde
     │                        │
  João Pessoa ── Campina ─────┘
                 Grande

  "Recife → Arcoverde?" BFS: Recife (0) → Caruaru, João Pessoa (1)
                             → Arcoverde, Campina Grande (2)  ✓ 2 baldeações
```

## A estrutura em Python puro

No estilo do `core/contadores.py`, sem SQL e sem FastAPI, só dados simples:

```python
from collections import deque


class MapaDeRotas:
    """Grafo não-direcionado: dict cidade -> set de cidades vizinhas.

    - adicionar rota / consultar vizinhos: O(1)
    - reconstruir do zero: O(n rotas), só no startup
    - caminho mais curto (BFS): O(nós + arestas)
    """

    def __init__(self) -> None:
        self._vizinhos: dict[str, set[str]] = {}

    def reconstruir(self, rotas: list[tuple[str, str]]) -> None:
        self._vizinhos = {}
        for a, b in rotas:
            self.adicionar_rota(a, b)

    def adicionar_rota(self, a: str, b: str) -> None:
        """O(1): dois inserts em set."""
        self._vizinhos.setdefault(a, set()).add(b)
        self._vizinhos.setdefault(b, set()).add(a)  # não-direcionado: vale nos 2 sentidos

    def caminho_mais_curto(self, origem: str, destino: str) -> list[str] | None:
        """BFS com dict de predecessores. Devolve [origem, ..., destino] ou None.

        A deque garante a ordem "todas as cidades a K passos antes das de K+1
        passos". Por isso o primeiro jeito de chegar ao destino é sempre o
        mais curto.
        """
        if origem not in self._vizinhos or destino not in self._vizinhos:
            return None
        if origem == destino:
            return [origem]

        veio_de: dict[str, str] = {}          # cidade -> de onde cheguei nela
        fila = deque([origem])
        visitadas = {origem}

        while fila:
            atual = fila.popleft()            # popleft = FIFO = busca em largura
            for vizinha in self._vizinhos[atual]:
                if vizinha in visitadas:
                    continue                  # sem isso, ciclos = loop infinito
                veio_de[vizinha] = atual
                if vizinha == destino:
                    return self._montar_caminho(veio_de, origem, destino)
                visitadas.add(vizinha)
                fila.append(vizinha)
        return None                           # componentes desconexos: não dá para chegar

    def _montar_caminho(self, veio_de: dict[str, str], origem: str, destino: str) -> list[str]:
        """Anda de trás para frente pelo dict de predecessores."""
        caminho = [destino]
        while caminho[-1] != origem:
            caminho.append(veio_de[caminho[-1]])
        return list(reversed(caminho))
```

Troque `popleft()` por `pop()` e a mesma função vira DFS (busca em
profundidade), que acha um caminho qualquer, não o mais curto. A `deque` é o
que faz a BFS achar o mais curto.

## Big O honesto

| Operação | MapaDeRotas | Ingênua (lista de pares (a, b)) |
|---|---|---|
| adicionar rota | O(1) | O(1), empata |
| vizinhos de X | O(1) | O(n rotas), varre tudo |
| caminho mais curto | O(nós + arestas) | O(nós × arestas) ou pior, refazendo a varredura a cada passo |
| memória | O(nós + arestas) | O(rotas), empata |

Com 50 cidades, a diferença é invisível (menos de 1 ms). A estrutura começa a
compensar quando o grafo cresce ou quando você faz muitas consultas. Meça.

## Como medir (10 linhas)

Gere N nós com conexões aleatórias, construa fora do timer, meça só a operação,
repita pelo menos 5 vezes e tire a média. Compare N = 1_000 / 10_000 / 100_000.

```python
import random
import timeit

for n in (1_000, 10_000, 100_000):
    cidades = [f"cidade{i}" for i in range(n)]
    rotas = [(random.choice(cidades), random.choice(cidades)) for _ in range(n * 3)]
    mapa = MapaDeRotas()
    mapa.reconstruir(rotas)                       # constrói FORA do timer

    def com_grafo():
        mapa.caminho_mais_curto(cidades[0], cidades[-1])

    def ingenua():                                # varre a lista de rotas a cada passo
        # ... sua versão com a lista crua de pares
        pass

    t = timeit.repeat(com_grafo, number=10, repeat=5)
    print(n, "grafo:", min(t) / 10)
```

Cole os números no `DECISIONS.md` e escreva uma frase de interpretação. Se a
versão ingênua ganhar com N pequeno, o resultado é válido. O que importa é a
interpretação, não a vitória da estrutura mais sofisticada.

## Onde isso aparece no mundo real

GPS e apps de transporte (menor caminho), "pessoas que talvez você conheça"
(vizinhos de vizinhos), roteamento de pacotes na internet, dependências entre
pacotes do `uv`/`npm`.
