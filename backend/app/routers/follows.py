from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.follow import EstadoFollow
from app.schemas.user import UserPage
from app.services import follows as service

router = APIRouter(prefix="/usuarios", tags=["follows"])


@router.get("/{username}/follow", response_model=EstadoFollow)
def estado(
    username: str,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.estado(db, pessoa, username)


@router.post("/{username}/follow", response_model=EstadoFollow)
def seguir(
    username: str,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.seguir(db, pessoa, username)


@router.delete("/{username}/follow", response_model=EstadoFollow)
def deixar_de_seguir(
    username: str,
    db: Session = Depends(get_db),
    pessoa: User = Depends(get_current_user),
):
    return service.deixar_de_seguir(db, pessoa, username)


@router.get("/{username}/seguidores", response_model=UserPage)
def listar_seguidores(
    username: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    usuarios, total = service.seguidores(db, username, offset, limit)
    return UserPage(items=usuarios, total=total, offset=offset, limit=limit)


@router.get("/{username}/seguindo", response_model=UserPage)
def listar_seguindo(
    username: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    usuarios, total = service.seguindo(db, username, offset, limit)
    return UserPage(items=usuarios, total=total, offset=offset, limit=limit)
