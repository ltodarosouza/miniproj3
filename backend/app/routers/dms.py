from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.dm import MensagemCreate, MensagemOut, MensagemPage
from app.services import dms

router = APIRouter(prefix="/dms", tags=["dms"])


@router.post("/{username}", response_model=MensagemOut, status_code=status.HTTP_201_CREATED)
def enviar_mensagem(
    username: str,
    dados: MensagemCreate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> MensagemOut:
    return dms.enviar(db, eu, username, dados)


@router.get("/{username}", response_model=MensagemPage)
def listar_mensagens(
    username: str,
    depois_de: int | None = Query(default=None, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> MensagemPage:
    return dms.listar(db, eu, username, depois_de, limit)
