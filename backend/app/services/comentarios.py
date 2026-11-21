from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.comentario import Comentario
from app.models.user import User
from app.schemas.comentario import ComentarioCreate, ComentarioOut, ComentarioPage
from app.services.posts import buscar


def _montar_saidas(db: Session, comentarios: list[Comentario]) -> list[ComentarioOut]:
    autores_ids = {comentario.autor_id for comentario in comentarios}
    autores = {
        usuario.id: usuario
        for usuario in db.scalars(select(User).where(User.id.in_(autores_ids)))
    }
    return [
        ComentarioOut(
            id=comentario.id,
            post_id=comentario.post_id,
            autor=autores[comentario.autor_id],
            texto=comentario.texto,
            created_at=comentario.created_at,
        )
        for comentario in comentarios
    ]


def criar(db: Session, eu: User, post_id: int, dados: ComentarioCreate) -> ComentarioOut:
    buscar(db, post_id)
    comentario = Comentario(post_id=post_id, autor_id=eu.id, texto=dados.texto)
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    return _montar_saidas(db, [comentario])[0]


def listar(db: Session, post_id: int, offset: int, limit: int) -> ComentarioPage:
    buscar(db, post_id)
    do_post = Comentario.post_id == post_id
    total = db.scalar(select(func.count()).select_from(Comentario).where(do_post)) or 0
    comentarios = list(
        db.scalars(
            select(Comentario)
            .where(do_post)
            .order_by(Comentario.id)
            .offset(offset)
            .limit(limit)
        )
    )
    return ComentarioPage(
        items=_montar_saidas(db, comentarios),
        total=total,
        offset=offset,
        limit=limit,
    )
