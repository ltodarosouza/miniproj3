import os

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session as DbSession

from app.db import get_db
from app.models.session import Session
from app.models.user import User


def token_do_header(authorization: str | None) -> str | None:
    if authorization and authorization.startswith("Bearer "):
        return authorization.removeprefix("Bearer ").strip() or None
    return None


def _pelo_token(db: DbSession, authorization: str | None) -> User | None:
    token = token_do_header(authorization)
    if token is None:
        return None

    sessao = db.get(Session, token)
    if sessao is None:
        return None
    return db.get(User, sessao.user_id)


def get_current_user(
    authorization: str | None = Header(default=None),
    x_user_id: int | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> User:
    if os.environ.get("DEBUG") == "true" and x_user_id is not None:
        user = db.get(User, x_user_id)
        if user:
            return user

    user = _pelo_token(db, authorization)
    if user is not None:
        return user

    raise HTTPException(status_code=401, detail="não autenticado")


def get_current_user_opcional(
    authorization: str | None = Header(default=None),
    x_user_id: int | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> User | None:
    if os.environ.get("DEBUG") == "true" and x_user_id is not None:
        return db.get(User, x_user_id)

    return _pelo_token(db, authorization)
