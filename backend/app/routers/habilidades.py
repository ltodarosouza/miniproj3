from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.habilidade import Habilidade
from app.schemas.troca import HabilidadeResumo

router = APIRouter(prefix="/habilidades", tags=["habilidades"])


@router.get("", response_model=dict[str, list[HabilidadeResumo]])
def listar_habilidades(db: Session = Depends(get_db)):
    habilidades = db.scalars(select(Habilidade).order_by(Habilidade.categoria, Habilidade.nome))
    return {"items": list(habilidades)}
