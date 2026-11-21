# Árvores (com parent_id + recursão)

## A ideia em 1 parágrafo

Árvore guarda itens que têm "pai". Cada item aponta para o item de cima, e o
item sem pai é a raiz. Você não precisa de um tipo novo: uma lista de itens com
`parent_id` já é uma árvore. O trabalho é transformar essa lista achatada em
aninhamento (quem é filho de quem) e percorrê-lo. Para percorrer algo aninhado,
use **recursão**: uma função que trata um nó e chama a si mesma para os filhos.

Exemplo deste guia (de propósito, fora do catálogo): pastas e arquivos.

```
id=1  docs/          (parent=None)      docs/
id=2  docs/fotos/    (parent=1)    →    ├── fotos/
id=3  praia.png      (parent=2)    →    │   └── praia.png
id=4  cv.pdf         (parent=1)         └── cv.pdf
```

## A estrutura em Python puro

```python
class ArvoreDePastas:
    """Árvore montada de uma lista (id, parent_id, nome).

    - montar índice filhos-por-pai: O(n), uma passada
    - achar filhos de um nó: O(1) (lookup no dict)
    - serializar/percorrer a árvore toda: O(n), visita cada nó 1 vez
    """

    def __init__(self) -> None:
        self._nome: dict[int, str] = {}
        self._filhos: dict[int | None, list[int]] = {}   # parent_id -> [ids]

    def reconstruir(self, itens: list[tuple[int, int | None, str]]) -> None:
        """Recebe a lista achatada (como viria do banco) e indexa por pai."""
        self._nome = {}
        self._filhos = {}
        for id_, parent_id, nome in itens:
            self._nome[id_] = nome
            self._filhos.setdefault(parent_id, []).append(id_)

    def como_dict(self, id_: int | None = None) -> list[dict]:
        """Serializa em aninhamento, pronto para virar JSON.

        Recursão: monto um nível e chamo a mim mesma para os filhos.
        Caso base implícito: nó sem filhos → self._filhos.get(...) = [] →
        o for não roda → a recursão para.
        """
        return [
            {"id": f, "nome": self._nome[f], "filhos": self.como_dict(f)}
            for f in self._filhos.get(id_, [])
        ]

    def profundidade(self, id_: int | None = None) -> int:
        """Quantos níveis a árvore tem abaixo deste nó. O(n)."""
        filhos = self._filhos.get(id_, [])
        if not filhos:                        # caso base explícito
            return 0
        return 1 + max(self.profundidade(f) for f in filhos)
```

Toda recursão precisa de duas coisas: (1) um **caso base** que não chama a si
mesmo (nó sem filhos); (2) chamadas que trabalham num problema menor (um nó mais
fundo). Se faltar uma das duas, o Python lança `RecursionError`.

No front, a mesma ideia é um componente que renderiza a si mesmo: `<Pasta>`
renderiza o nome e um `<Pasta>` para cada filho.

## Big O honesto

| Operação | Árvore indexada | Ingênua (varrer a lista achatada) |
|---|---|---|
| montar índice | O(n) uma vez | - |
| filhos de um nó | O(1) | O(n), filtra a lista inteira |
| serializar tudo aninhado | O(n) | O(n²), para cada nó filtra a lista de novo |
| inserir item | O(1) (append no dict) | O(1), empata |

A versão ingênua de "aninhar" faz
`[i for i in itens if i.parent_id == no.id]` dentro da recursão. São n
filtragens de n itens, ou seja, O(n²). Com 30 itens ninguém percebe. Com
10_000, percebe.

## Como medir (10 linhas)

```python
import random
import timeit

for n in (1_000, 10_000, 100_000):
    # cada item aponta para um pai aleatório anterior → árvore válida, sem ciclos
    itens = [(i, random.randint(0, i - 1) if i else None, f"pasta{i}") for i in range(n)]
    arvore = ArvoreDePastas()
    arvore.reconstruir(itens)                     # constrói FORA do timer

    def indexada():
        arvore.como_dict()

    def ingenua():
        def monta(pai):  # filtra a lista inteira em cada nível, O(n²)
            return [{"id": i, "filhos": monta(i)} for i, p, _ in itens if p == pai]
        monta(None)

    print(n,
          "indexada:", min(timeit.repeat(indexada, number=5, repeat=5)) / 5,
          "ingênua:", min(timeit.repeat(ingenua, number=5, repeat=5)) / 5)
```

Cole os números no `DECISIONS.md` e escreva uma frase de interpretação. Se as
duas versões empatam com N pequeno, o resultado é válido. Explique o porquê no
`DECISIONS.md`.

## Onde isso aparece no mundo real

Sistema de arquivos, o DOM do navegador, threads de e-mail, categorias de
e-commerce, o JSON aninhado de qualquer API.
