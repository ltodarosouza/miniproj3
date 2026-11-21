from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.habilidade import Habilidade

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
