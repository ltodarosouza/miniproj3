from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.post import PostCreate, PostOut
from app.services import posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def criar_post(
    dados: PostCreate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.criar(db, eu, dados)


@router.get(
    "/{post_id}",
    response_model=PostOut,
    dependencies=[Depends(get_current_user)],
)
def detalhar_post(post_id: int, db: Session = Depends(get_db)) -> PostOut:
    return posts.detalhar(db, post_id)