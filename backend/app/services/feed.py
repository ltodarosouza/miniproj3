from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.matches import indice_matches
from app.core.tempo import agora_utc
from app.models.follow import Follow
from app.models.habilidade import Habilidade
from app.models.post import Post
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.schemas.feed import FeedPage, HabilidadeEmAlta, ItemFeed, MeuProgresso
from app.services.posts import montar_saidas
from app.services.streak import streak_do_usuario

SEMANA = timedelta(days=7)


def _quem_estuda_o_mesmo(db: Session, eu: User) -> set[int]:
    minhas = select(UserHabilidade.habilidade_id).where(UserHabilidade.usuario_id == eu.id)
    return set(
        db.scalars(
            select(UserHabilidade.usuario_id).where(UserHabilidade.habilidade_id.in_(minhas))
        )
    )


def _motivos(db: Session, eu: User) -> dict[int, str]:
    seguidos = set(db.scalars(select(Follow.seguido_id).where(Follow.seguidor_id == eu.id)))
    professores = indice_matches.pode_me_ensinar(eu.id)
    motivos = {autor: "pode_te_ensinar" for autor in professores}
    motivos.update({autor: "seguindo" for autor in seguidos})
    motivos[eu.id] = "meu"
    # Sempre o mesmo conjunto de autores, para a paginação não pular posts.
    for autor in _quem_estuda_o_mesmo(db, eu):
        motivos.setdefault(autor, "descobrir")
    return motivos


def listar(db: Session, eu: User, offset: int, limit: int) -> FeedPage:
    motivos = _motivos(db, eu)
    do_feed = Post.autor_id.in_(set(motivos))
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
        ItemFeed(**dict(saida), motivo=motivos[post.autor_id])
        for post, saida in zip(posts, montar_saidas(db, eu, posts))
    ]
    return FeedPage(items=items, total=total, offset=offset, limit=limit)


def em_alta(db: Session, limite: int = 5) -> list[HabilidadeEmAlta]:
    desde = agora_utc() - SEMANA
    posts = func.count(Post.id).label("posts")
    linhas = db.execute(
        select(Habilidade, posts, func.coalesce(func.sum(Post.minutos_estudados), 0))
        .join(Post, Post.habilidade_id == Habilidade.id)
        .where(Post.created_at >= desde)
        .group_by(Habilidade.id)
        .order_by(posts.desc(), Habilidade.nome)
        .limit(limite)
    )
    return [
        HabilidadeEmAlta(
            id=h.id, nome=h.nome, categoria=h.categoria, posts=total, minutos=int(minutos)
        )
        for h, total, minutos in linhas
    ]


def meu_progresso(db: Session, eu: User) -> MeuProgresso:
    desde = agora_utc() - SEMANA
    posts_semana, minutos = db.execute(
        select(func.count(Post.id), func.coalesce(func.sum(Post.minutos_estudados), 0)).where(
            Post.autor_id == eu.id, Post.created_at >= desde
        )
    ).one()
    return MeuProgresso(
        streak=streak_do_usuario(db, eu.id),
        minutos_semana=int(minutos),
        posts_semana=posts_semana,
    )
