from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.troca import TrocaCreate, TrocaOut, TrocaPage
from app.services import trocas as service

router = APIRouter(prefix="/trocas", tags=["trocas"])


@router.post("", response_model=TrocaOut, status_code=201)
def propor_troca(
    dados: TrocaCreate,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.criar(db, pessoa, dados)


@router.post("/{troca_id}/confirmar", response_model=TrocaOut)
def confirmar_troca(
    troca_id: int,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.responder(db, pessoa, troca_id, "confirmada")


@router.post("/{troca_id}/recusar", response_model=TrocaOut)
def recusar_troca(
    troca_id: int,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.responder(db, pessoa, troca_id, "recusada")


@router.get("", response_model=TrocaPage)
def listar_trocas(
    com: str | None = Query(default=None),
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return TrocaPage(items=service.listar(db, pessoa, com))
