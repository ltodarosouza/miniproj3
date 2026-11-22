import unicodedata


class _NoTrie:
    def __init__(self) -> None:
        self.filhos: dict[str, "_NoTrie"] = {}
        self.habilidade_id: int | None = None
        self.nome: str | None = None


class TrieDeHabilidades:
    """Trie casefold e sem acento para nomes de habilidades.

    Inserção: O(L), onde L é o comprimento do nome.
    Busca por prefixo: O(P + K log K), onde P é o comprimento do prefixo
    e K é o número de resultados encontrados (limitado a 10).
    """

    def __init__(self) -> None:
        self.raiz = _NoTrie()
        self._nomes: dict[int, str] = {}

    def _normalizar(self, texto: str) -> str:
        decomposto = unicodedata.normalize("NFKD", texto)
        sem_acento = "".join(c for c in decomposto if not unicodedata.combining(c))
        return sem_acento.casefold()

    def reconstruir(self, habilidades: list[tuple[int, str]]) -> None:
        self.raiz = _NoTrie()
        self._nomes = {}
        for habilidade_id, nome in habilidades:
            self.adicionar(habilidade_id, nome)

    def adicionar(self, habilidade_id: int, nome: str) -> None:
        self._nomes[habilidade_id] = nome
        no = self.raiz
        for caractere in self._normalizar(nome):
            no = no.filhos.setdefault(caractere, _NoTrie())
        no.habilidade_id = habilidade_id
        no.nome = nome

    def _coletar(self, no: _NoTrie, limite: int) -> list[tuple[int, str]]:
        resultados: list[tuple[int, str]] = []
        if len(resultados) >= limite:
            return resultados
        pilha = [no]
        while pilha and len(resultados) < limite:
            atual = pilha.pop()
            if atual.habilidade_id is not None:
                resultados.append((atual.habilidade_id, atual.nome))  # type: ignore[arg-type]
            # ordem alfabética: filhos em ordem reversa na pilha sai na ordem certa
            for chave in sorted(atual.filhos.keys(), reverse=True):
                pilha.append(atual.filhos[chave])
        return resultados

    def buscar(self, prefixo: str, limite: int = 10) -> list[tuple[int, str]]:
        prefixo = self._normalizar(prefixo)
        if not prefixo:
            return []
        no = self.raiz
        for caractere in prefixo:
            no = no.filhos.get(caractere)
            if no is None:
                return []
        resultados = self._coletar(no, limite)
        return sorted(resultados, key=lambda item: self._normalizar(item[1]))

    def nome_de(self, habilidade_id: int) -> str | None:
        return self._nomes.get(habilidade_id)


trie_habilidades = TrieDeHabilidades()
