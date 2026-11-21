import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import bcrypt
from sqlalchemy import select

from app.db import Base, SessionLocal, engine
from app.models.user import User
from app.services.habilidades import garantir_catalogo

SENHA_SEED = "senha-forte-123"


def _hash(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


USUARIOS = [
    User(
        username="ada",
        name="Ada Lovelace",
        bio="a primeira a programar",
        password_hash=_hash(SENHA_SEED),
    ),
    User(
        username="linus",
        name="Linus Torvalds",
        bio="just for fun",
        password_hash=_hash(SENHA_SEED),
    ),
    User(
        username="grace",
        name="Grace Hopper",
        bio="caçadora de bugs literais",
        password_hash=_hash(SENHA_SEED),
    ),
]


def main() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        garantir_catalogo(db)
        if db.scalar(select(User).limit(1)):
            print("banco já tem dados — apague backend/app.db e rode de novo")
            return
        db.add_all(USUARIOS)
        db.commit()
        print(f"seed ok: {len(USUARIOS)} usuários criados")
        print(f"senha dos usuários do seed: {SENHA_SEED}")


if __name__ == "__main__":
    main()
