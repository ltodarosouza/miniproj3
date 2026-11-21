import os

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User


def get_current_user(
    x_user_id: int | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if os.environ.get("DEBUG") == "true" and x_user_id is not None:
        user = db.get(User, x_user_id)
        if user:
            return user
    raise HTTPException(status_code=401, detail="não autenticado")
