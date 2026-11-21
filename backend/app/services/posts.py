from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.habilidade import Habilidade
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostCreate, PostOut


def montar_saidas(db: Session, posts: list[Post]) -> list[PostOut]:
    autores_ids = {post.autor_id for post in posts}
    habilidades_ids = {
        post.habilidade_id for post in posts if post.habilidade_id is not None
    }
    autores = {
        usuario.id: usuario
        for usuario in db.scalars(select(User).where(User.id.in_(autores_ids)))
    }
    habilidades = {
        habilidade.id: habilidade
        for habilidade in db.scalars(
            select(Habilidade).where(Habilidade.id.in_(habilidades_ids))
        )
    }
    return [
        PostOut(
            id=post.id,
            autor=autores[post.autor_id],
            texto=post.texto,
            habilidade=habilidades.get(post.habilidade_id),
            minutos_estudados=post.minutos_estudados,
            imagem_url=post.imagem_url,
            created_at=post.created_at,
        )
        for post in posts
    ]


def criar(db: Session, eu: User, dados: PostCreate) -> PostOut:
    if dados.habilidade_id is not None and db.get(Habilidade, dados.habilidade_id) is None:
        raise HTTPException(status_code=422, detail="habilidade não encontrada")
    post = Post(autor_id=eu.id, **dados.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return montar_saidas(db, [post])[0]


def buscar(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="post não encontrado")
    return post


def detalhar(db: Session, post_id: int) -> PostOut:
    return montar_saidas(db, [buscar(db, post_id)])[0]