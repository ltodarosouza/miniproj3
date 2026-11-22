"""Slice de exemplo completo: model → schema → service → router → página Next.

Toda feature nova imita este caminho. 1 arquivo por router — registre o seu
com uma linha em main.py.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.contadores import contador_iniciais
from app.db import get_db
from app.deps import get_current_user, get_current_user_opcional
from app.models.user import User
from app.schemas.post import PostPage
from app.schemas.user import (
    HabilidadePerfilOut,
    HabilidadeItem,
    PerfilOut,
    PerfilUpdate,
    UserCreate,
    UserOut,
    UserPage,
)
from app.services import users as service

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


@router.get("", response_model=UserPage)
def listar_usuarios(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None, max_length=50),
    db: Session = Depends(get_db),
):
    users, total = service.listar(db, offset, limit, q)
    return UserPage(items=users, total=total, offset=offset, limit=limit)


@router.get("/stats")
def stats_por_inicial():
    """Endpoint que USA a estrutura do core/ — alvo do teste-sabotagem de exemplo."""
    return {"usuarios_por_inicial": contador_iniciais.contagem()}


@router.patch("/eu", response_model=PerfilOut)
def editar_meu_perfil(
    dados: PerfilUpdate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
):
    return service.atualizar_perfil(db, eu, dados)


@router.put("/eu/habilidades", response_model=list[HabilidadePerfilOut])
def salvar_minhas_habilidades(
    itens: list[HabilidadeItem],
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
):
    return service.salvar_habilidades(db, eu, itens)


@router.get("/{username}", response_model=PerfilOut)
def ver_perfil(
    username: str,
    db: Session = Depends(get_db),
    eu: User | None = Depends(get_current_user_opcional),
):
    return service.perfil(db, username)


@router.get("/{username}/posts", response_model=PostPage)
def ver_posts_do_usuario(
    username: str,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
):
    return service.posts_do_usuario(db, eu, username, offset, limit)


@router.post("", response_model=UserOut, status_code=201)
def criar_usuario(dados: UserCreate, db: Session = Depends(get_db)):
    # ponytail: criação sem senha — o guia de auth evolui isto para o registro real
    return service.criar(db, dados)
