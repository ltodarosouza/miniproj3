import difflib
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.catalogo import normalizar, trie_habilidades
from app.models.habilidade import Habilidade
from app.services import ia_mapeador

logger = logging.getLogger(__name__)

CATALOGO = [
    ("Python", "tech"),
    ("JavaScript", "tech"),
    ("TypeScript", "tech"),
    ("Java", "tech"),
    ("C", "tech"),
    ("C++", "tech"),
    ("C#", "tech"),
    ("Go", "tech"),
    ("Rust", "tech"),
    ("PHP", "tech"),
    ("Kotlin", "tech"),
    ("Swift", "tech"),
    ("HTML", "tech"),
    ("CSS", "tech"),
    ("React", "tech"),
    ("Next.js", "tech"),
    ("Node.js", "tech"),
    ("Vue", "tech"),
    ("Angular", "tech"),
    ("Django", "tech"),
    ("FastAPI", "tech"),
    ("Flask", "tech"),
    ("Spring", "tech"),
    ("SQL", "tech"),
    ("PostgreSQL", "tech"),
    ("MongoDB", "tech"),
    ("Git", "tech"),
    ("GitHub", "tech"),
    ("Docker", "tech"),
    ("Linux", "tech"),
    ("AWS", "tech"),
    ("Figma", "tech"),
    ("Testes automatizados", "tech"),
    ("Machine Learning", "tech"),
    ("Pandas", "tech"),
    ("Cálculo 1", "disciplina"),
    ("Cálculo 2", "disciplina"),
    ("Álgebra Linear", "disciplina"),
    ("Matemática Discreta", "disciplina"),
    ("Estrutura de Dados", "disciplina"),
    ("Algoritmos", "disciplina"),
    ("Programação Orientada a Objetos", "disciplina"),
    ("Banco de Dados", "disciplina"),
    ("Redes de Computadores", "disciplina"),
    ("Sistemas Operacionais", "disciplina"),
    ("Probabilidade e Estatística", "disciplina"),
    ("Física 1", "disciplina"),
    ("Engenharia de Software", "disciplina"),
]


def garantir_catalogo(db: Session) -> None:
    existentes = set(db.scalars(select(Habilidade.nome)))
    db.add_all(
        Habilidade(nome=nome, categoria=categoria)
        for nome, categoria in CATALOGO
        if nome not in existentes
    )
    db.commit()


def reconstruir_trie(db: Session) -> None:
    habilidades = list(
        db.execute(select(Habilidade.id, Habilidade.nome).order_by(Habilidade.nome))
    )
    trie_habilidades.reconstruir(
        [(habilidade_id, nome) for habilidade_id, nome in habilidades]
    )


def autocomplete(db: Session, prefixo: str, limite: int = 10) -> list[Habilidade]:
    sugestoes = trie_habilidades.buscar(prefixo, limite)
    if not sugestoes:
        return []
    ids = [habilidade_id for habilidade_id, _ in sugestoes]
    habilidades = {
        h.id: h
        for h in db.scalars(select(Habilidade).where(Habilidade.id.in_(ids)))
    }
    return [habilidades[habilidade_id] for habilidade_id, _ in sugestoes]


def mapear_texto(db: Session, texto: str) -> Habilidade | None:
    nomes = list(db.scalars(select(Habilidade.nome)))
    if not nomes:
        return None

    nome_mapeado = ia_mapeador.mapear(texto, nomes)
    if nome_mapeado:
        habilidade = db.scalar(select(Habilidade).where(Habilidade.nome == nome_mapeado))
        if habilidade:
            return habilidade

    normalizado_para_original = {normalizar(nome): nome for nome in nomes}
    texto_normalizado = normalizar(texto)
    proximos = difflib.get_close_matches(
        texto_normalizado,
        list(normalizado_para_original.keys()),
        n=1,
        cutoff=0.5,
    )
    if not proximos:
        logger.info("Fallback difflib não encontrou correspondência para %r.", texto)
        return None

    nome_original = normalizado_para_original[proximos[0]]
    logger.info("Fallback difflib mapeou %r -> %r", texto, nome_original)
    return db.scalar(select(Habilidade).where(Habilidade.nome == nome_original))


def buscar_por_id(db: Session, habilidade_id: int) -> Habilidade | None:
    return db.scalar(select(Habilidade).where(Habilidade.id == habilidade_id))
