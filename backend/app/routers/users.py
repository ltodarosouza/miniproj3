"""Slice de exemplo completo: model → schema → service → router → página Next.

Toda feature nova imita este caminho. 1 arquivo por router — registre o seu
com uma linha em main.py.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.contadores import contador_iniciais
from app.db import get_db
from app.schemas.user import UserCreate, UserOut, UserPage
from app.services import users as service

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=UserPage)
def listar_usuarios(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    users, total = service.listar(db, offset, limit)
    return UserPage(items=users, total=total, offset=offset, limit=limit)


@router.get("/stats")
def stats_por_inicial():
    """Endpoint que USA a estrutura do core/ — alvo do teste-sabotagem de exemplo."""
    return {"usuarios_por_inicial": contador_iniciais.contagem()}


@router.post("", response_model=UserOut, status_code=201)
def criar_usuario(dados: UserCreate, db: Session = Depends(get_db)):
    # ponytail: criação sem senha — o guia de auth evolui isto para o registro real
    return service.criar(db, dados)
