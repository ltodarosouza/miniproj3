from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.busca import DetalheHabilidade, ResultadoBusca, TipoBusca
from app.services import busca

router = APIRouter(prefix="/busca", tags=["busca"])


@router.get("", response_model=ResultadoBusca)
def buscar(
    q: str = Query(default="", max_length=100),
    tipo: TipoBusca = "pessoas",
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> ResultadoBusca:
    return busca.buscar(db, eu, q, tipo, offset, limit)


@router.get("/habilidades/{habilidade_id}", response_model=DetalheHabilidade)
def ver_habilidade(
    habilidade_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> DetalheHabilidade:
    return busca.detalhar_habilidade(db, eu, habilidade_id)
