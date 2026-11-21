from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.feed import FeedPage
from app.services import feed

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedPage)
def ver_feed(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> FeedPage:
    return feed.listar(db, eu, offset, limit)
