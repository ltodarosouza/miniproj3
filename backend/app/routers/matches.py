from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.match import Matches
from app.services import matches as service

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=Matches)
def listar(db: Session = Depends(get_db), pessoa: User = Depends(get_current_user)):
    return service.listar(db, pessoa)
