from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.curtida import Curtida
from app.models.user import User
from app.services.posts import buscar


def curtir(db: Session, eu: User, post_id: int) -> None:
    buscar(db, post_id)
    db.add(Curtida(usuario_id=eu.id, post_id=post_id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()


def descurtir(db: Session, eu: User, post_id: int) -> None:
    buscar(db, post_id)
    db.execute(
        delete(Curtida).where(
            Curtida.usuario_id == eu.id, Curtida.post_id == post_id
        )
    )
    db.commit()
