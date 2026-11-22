from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.contadores import contador_iniciais
from app.models.user import User
from app.schemas.user import UserCreate


def listar(db: Session, offset: int, limit: int) -> tuple[list[User], int]:
    total = db.scalar(select(func.count()).select_from(User)) or 0
    users = list(
        db.scalars(
            select(User).order_by(User.username).offset(offset).limit(limit)
        )
    )
    return users, total


def criar_usuario(
    db: Session,
    *,
    username: str,
    name: str,
    password_hash: str = "",
    bio: str = "",
    avatar_url: str = "",
) -> User:
    ja_existe = db.scalar(select(User.id).where(User.username == username))
    if ja_existe is not None:
        raise HTTPException(status_code=409, detail="username já existe")

    user = User(
        username=username,
        name=name,
        bio=bio,
        avatar_url=avatar_url,
        password_hash=password_hash,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="username já existe")

    db.refresh(user)
    contador_iniciais.incrementar(user.username)
    return user


def criar(db: Session, dados: UserCreate) -> User:
    return criar_usuario(
        db,
        username=dados.username,
        name=dados.name,
        bio=dados.bio,
        avatar_url=dados.avatar_url,
    )
