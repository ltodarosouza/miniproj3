from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.core.limite import limitador_mapear
from app.deps import get_current_user
from app.models.user import User
from app.schemas.habilidade import (
    HabilidadeMapearIn,
    HabilidadeMapearOut,
    HabilidadeResumo,
)
from app.services import habilidades as service

router = APIRouter(prefix="/habilidades", tags=["habilidades"])


@router.get("", response_model=dict[str, list[HabilidadeResumo]])
def listar_habilidades(db: Session = Depends(get_db)):
    return {"items": service.listar(db)}


@router.get("/autocomplete", response_model=dict[str, list[HabilidadeResumo]])
def autocomplete_habilidades(
    prefixo: str = Query(min_length=1, max_length=80),
    limite: int = Query(default=10, ge=1, le=20),
    db: Session = Depends(get_db),
):
    items = service.autocomplete(db, prefixo, limite)
    return {"items": items}


@router.post("/mapear", response_model=HabilidadeMapearOut)
def mapear_habilidade(
    dados: HabilidadeMapearIn,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user),
):
    if not limitador_mapear.permitir(usuario.id):
        raise HTTPException(status_code=429, detail="Muitas buscas seguidas. Espere um pouco e tente de novo.")
    habilidade = service.mapear_texto(db, dados.texto)
    return HabilidadeMapearOut(habilidade=habilidade)
