from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.avaliacao import AvaliacaoCreate, AvaliacaoOut, ResumoAvaliacoes
from app.schemas.troca import TrocaPage
from app.services import avaliacoes as service

router = APIRouter(tags=["avaliacoes"])


@router.get("/trocas/pendentes-avaliacao", response_model=TrocaPage)
def listar_pendentes(
    db: Session = Depends(get_db), pessoa: User = Depends(get_current_user)
):
    return TrocaPage(items=service.pendentes(db, pessoa))


@router.post(
    "/trocas/{troca_id}/avaliar", response_model=AvaliacaoOut, status_code=201
)
def avaliar_troca(
    troca_id: int,
    dados: AvaliacaoCreate,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.avaliar(db, pessoa, troca_id, dados)


@router.get("/usuarios/{username}/avaliacoes", response_model=ResumoAvaliacoes)
def listar_avaliacoes(username: str, db: Session = Depends(get_db)):
    return service.resumo(db, username)
