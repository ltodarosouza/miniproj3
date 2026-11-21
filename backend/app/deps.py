"""Dependências compartilhadas dos endpoints.

get_current_user é a porta de entrada da autenticação: toda rota protegida
declara `user: User = Depends(get_current_user)`. Ela NÃO vem pronta.
"""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User


def get_current_user(db: Session = Depends(get_db)) -> User:
    # Passo 0 do guia: docs/guias/01-autenticacao.md — comece por lá.
    # O guia traz o bypass de desenvolvimento (destrava seus colegas)
    # e termina com você trocando o corpo desta função pela auth real.
    raise NotImplementedError("siga docs/guias/01-autenticacao.md")
