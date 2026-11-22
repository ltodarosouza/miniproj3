from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session as DbSession

from app.db import get_db
from app.deps import get_current_user, token_do_header
from app.models.user import User
from app.schemas.auth import LoginIn, RegistroIn, TokenOut
from app.schemas.user import UserOut
from app.services import auth as service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/registro", response_model=UserOut, status_code=201)
def registro(dados: RegistroIn, db: DbSession = Depends(get_db)):
    return service.registrar(db, dados)


@router.post("/login", response_model=TokenOut)
def login(dados: LoginIn, db: DbSession = Depends(get_db)):
    user = service.autenticar(db, dados)
    return TokenOut(token=service.criar_sessao(db, user))


@router.get("/eu", response_model=UserOut)
def eu(user: User = Depends(get_current_user)):
    return user


@router.post("/logout", status_code=204)
def logout(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    token = token_do_header(authorization)
    if token is not None:
        service.encerrar_sessao(db, token)
