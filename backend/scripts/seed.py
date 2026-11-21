"""Seed mínimo: 3 usuários para o slice de exemplo renderizar.

A versão de verdade (com faker, posts, follows, likes...) é FEATURE DO NÚCLEO —
é do time. Rode com: make seed
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models.user import User

USUARIOS = [
    User(username="ada", name="Ada Lovelace", bio="a primeira a programar"),
    User(username="linus", name="Linus Torvalds", bio="just for fun"),
    User(username="grace", name="Grace Hopper", bio="caçadora de bugs literais"),
]


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalar(select(User).limit(1)):
            print("banco já tem dados — nada a fazer")
            return
        db.add_all(USUARIOS)
        db.commit()
        print(f"seed ok: {len(USUARIOS)} usuários criados")


if __name__ == "__main__":
    main()
