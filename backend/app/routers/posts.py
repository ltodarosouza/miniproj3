from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.post import PostCreate, PostOut, PostUpdate
from app.services import curtidas, posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def criar_post(
    dados: PostCreate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.criar(db, eu, dados)


@router.get("/{post_id}", response_model=PostOut)
def detalhar_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.detalhar(db, eu, post_id)


@router.patch("/{post_id}", response_model=PostOut)
def editar_post(
    post_id: int,
    dados: PostUpdate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.editar(db, eu, post_id, dados)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    posts.apagar(db, eu, post_id)


@router.post(
    "/{post_id}/curtir",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["curtidas"],
)
def curtir_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    curtidas.curtir(db, eu, post_id)


@router.delete(
    "/{post_id}/curtir",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["curtidas"],
)
def descurtir_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    curtidas.descurtir(db, eu, post_id)