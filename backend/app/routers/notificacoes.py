from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.notificacao import NaoLidasOut, NotificacaoPage
from app.services import notificacoes as service

router = APIRouter(prefix="/notificacoes", tags=["notificacoes"])


@router.get("", response_model=NotificacaoPage)
def listar(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = Query(default=None, max_length=512),
    antes_de: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.listar(db, pessoa, offset, limit, cursor, antes_de)


@router.get("/nao-lidas", response_model=NaoLidasOut)
def nao_lidas(
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.nao_lidas(db, pessoa)


@router.post("/lidas", status_code=204)
def marcar_lidas(
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    service.marcar_lidas(db, pessoa)
    return Response(status_code=204)
