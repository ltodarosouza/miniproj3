from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.matches import indice_matches
from app.models.follow import Follow
from app.models.post import Post
from app.models.user import User
from app.schemas.feed import FeedPage, ItemFeed
from app.services.posts import montar_saidas


def _autores_do_feed(db: Session, eu: User) -> tuple[set[int], set[int]]:
    seguidos = set(
        db.scalars(select(Follow.seguido_id).where(Follow.seguidor_id == eu.id))
    )
    professores = indice_matches.quem_pode_ensinar(eu.id) - seguidos - {eu.id}
    return seguidos, professores


def listar(db: Session, eu: User, offset: int, limit: int) -> FeedPage:
    seguidos, professores = _autores_do_feed(db, eu)
    autores = seguidos | professores
    if not autores:
        return FeedPage(items=[], total=0, offset=offset, limit=limit)

    do_feed = Post.autor_id.in_(autores)
    total = db.scalar(select(func.count()).select_from(Post).where(do_feed)) or 0
    posts = list(
        db.scalars(
            select(Post)
            .where(do_feed)
            .order_by(Post.created_at.desc(), Post.id.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    items = [
        ItemFeed(
            **dict(saida),
            motivo="seguindo" if post.autor_id in seguidos else "pode_te_ensinar",
        )
        for post, saida in zip(posts, montar_saidas(db, eu, posts))
    ]
    return FeedPage(items=items, total=total, offset=offset, limit=limit)
