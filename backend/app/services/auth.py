import secrets

import bcrypt
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.models.session import Session as SessionModel
from app.models.user import User
from app.schemas.auth import LoginIn, RegistroIn
from app.services.users import criar_usuario


def _hash(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def registrar(db: DbSession, dados: RegistroIn) -> User:
    return criar_usuario(
        db,
        username=dados.username,
        name=dados.name,
        password_hash=_hash(dados.password),
    )


def autenticar(db: DbSession, dados: LoginIn) -> User:
    user = db.scalar(select(User).where(User.username == dados.username))
    if user is None or not user.password_hash:
        raise HTTPException(status_code=401, detail="usuário ou senha inválidos")

    try:
        confere = bcrypt.checkpw(
            dados.password.encode("utf-8"), user.password_hash.encode("utf-8")
        )
    except ValueError:
        confere = False

    if not confere:
        raise HTTPException(status_code=401, detail="usuário ou senha inválidos")
    return user


def criar_sessao(db: DbSession, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(SessionModel(token=token, user_id=user.id))
    db.commit()
    return token


def encerrar_sessao(db: DbSession, token: str) -> None:
    sessao = db.get(SessionModel, token)
    if sessao is not None:
        db.delete(sessao)
        db.commit()
