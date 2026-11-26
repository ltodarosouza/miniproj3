import random
import statistics
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.matches import IndiceMatches


TOTAL_HABILIDADES = 48
TAMANHOS = (100, 1_000, 10_000, 50_000)


def gerar_dados(total_usuarios: int) -> tuple[list[tuple[int, int, str]], dict[int, set[int]], dict[int, set[int]]]:
    sorteio = random.Random(42)
    registros = []
    sabem = {}
    querem = {}
    habilidades = range(1, TOTAL_HABILIDADES + 1)
    for usuario_id in range(1, total_usuarios + 1):
        conhecidas = set(sorteio.sample(habilidades, sorteio.randint(1, 5)))
        desejadas = set(sorteio.sample(habilidades, sorteio.randint(1, 5)))
        sabem[usuario_id] = conhecidas
        querem[usuario_id] = desejadas
        registros.extend((usuario_id, habilidade_id, "sei") for habilidade_id in conhecidas)
        registros.extend((usuario_id, habilidade_id, "quero_aprender") for habilidade_id in desejadas)
    return registros, sabem, querem


def varredura(eu: int, sabem: dict[int, set[int]], querem: dict[int, set[int]]) -> tuple[set[int], set[int]]:
    pode: set[int] = set()
    troca: set[int] = set()
    minhas_habilidades = sabem.get(eu, set())
    meus_interesses = querem.get(eu, set())
    for usuario_id in sabem:
        if usuario_id == eu:
            continue
        ensina = bool(meus_interesses & sabem[usuario_id])
        quer_ensinar = bool(minhas_habilidades & querem[usuario_id])
        if ensina:
            pode.add(usuario_id)
            if quer_ensinar:
                troca.add(usuario_id)
    return pode, troca


def mediana_consulta(funcao, ids: list[int]) -> float:
    tempos = []
    for usuario_id in ids:
        inicio = time.perf_counter()
        funcao(usuario_id)
        tempos.append((time.perf_counter() - inicio) * 1_000_000)
    return statistics.median(tempos)


def main() -> None:
    print("Mede a construção do índice invertido e o tempo de consulta de matches de troca.")
    print("A varredura percorre todos os usuários; consultas reportadas como mediana por pessoa.")
    print(f"{'usuários':>10}  {'construção do índice (ms)':>26}  {'consulta índice (µs, mediana)':>30}  {'consulta varredura (µs, mediana)':>34}  {'vezes mais rápido':>18}  {'tamanho médio do resultado de troca':>36}")
    for total_usuarios in TAMANHOS:
        registros, sabem, querem = gerar_dados(total_usuarios)
        indice = IndiceMatches()
        inicio = time.perf_counter()
        indice.reconstruir(registros)
        construcao_ms = (time.perf_counter() - inicio) * 1_000

        sorteio = random.Random(42 + total_usuarios)
        ids_validacao = sorteio.sample(range(1, total_usuarios + 1), min(50, total_usuarios))
        for eu in ids_validacao:
            pode, troca = varredura(eu, sabem, querem)
            if indice.pode_me_ensinar(eu) != pode:
                raise SystemExit(f"divergência em pode_me_ensinar para usuário {eu} com N={total_usuarios}")
            if indice.match_de_troca(eu) != troca:
                raise SystemExit(f"divergência em match_de_troca para usuário {eu} com N={total_usuarios}")

        total_consultas = 20 if total_usuarios == 50_000 else min(200, total_usuarios)
        ids_consulta = sorteio.sample(range(1, total_usuarios + 1), total_consultas)
        consulta_indice = mediana_consulta(indice.match_de_troca, ids_consulta)
        consulta_varredura = mediana_consulta(lambda eu: varredura(eu, sabem, querem)[1], ids_consulta)
        media_trocas = statistics.mean(len(indice.match_de_troca(eu)) for eu in ids_consulta)
        vezes = consulta_varredura / consulta_indice if consulta_indice else float("inf")
        print(f"{total_usuarios:10,d}  {construcao_ms:26.2f}  {consulta_indice:30.2f}  {consulta_varredura:34.2f}  {vezes:18.1f}  {media_trocas:36.2f}")
        if total_usuarios == 50_000:
            print("Nota: para N=50.000, a mediana usa 20 consultas para manter a execução rápida.")


if __name__ == "__main__":
    main()
