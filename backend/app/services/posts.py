from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models.curtida import Curtida
from app.models.habilidade import Habilidade
from app.models.post import Post
from app.models.user import User
from app.schemas.post import PostCreate, PostOut, PostUpdate


def montar_saidas(db: Session, eu: User, posts: list[Post]) -> list[PostOut]:
    posts_ids = {post.id for post in posts}
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
    curtidas = {
        post_id: total
        for post_id, total in db.execute(
            select(Curtida.post_id, func.count())
            .where(Curtida.post_id.in_(posts_ids))
            .group_by(Curtida.post_id)
        )
    }
    curtidos_por_mim = set(
        db.scalars(
            select(Curtida.post_id).where(
                Curtida.usuario_id == eu.id, Curtida.post_id.in_(posts_ids)
            )
        )
    )
    return [
        PostOut(
            id=post.id,
            autor=autores[post.autor_id],
            texto=post.texto,
            habilidade=habilidades.get(post.habilidade_id),
            minutos_estudados=post.minutos_estudados,
            imagem_url=post.imagem_url,
            created_at=post.created_at,
            curtidas=curtidas.get(post.id, 0),
            curtido=post.id in curtidos_por_mim,
        )
        for post in posts
    ]


def _exigir_habilidade(db: Session, habilidade_id: int | None) -> None:
    if habilidade_id is not None and db.get(Habilidade, habilidade_id) is None:
        raise HTTPException(status_code=422, detail="habilidade não encontrada")


def criar(db: Session, eu: User, dados: PostCreate) -> PostOut:
    _exigir_habilidade(db, dados.habilidade_id)
    post = Post(autor_id=eu.id, **dados.model_dump())
    db.add(post)
    db.commit()
    db.refresh(post)
    return montar_saidas(db, eu, [post])[0]


def buscar(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="post não encontrado")
    return post


def detalhar(db: Session, eu: User, post_id: int) -> PostOut:
    return montar_saidas(db, eu, [buscar(db, post_id)])[0]


def _post_do_autor(db: Session, eu: User, post_id: int) -> Post:
    post = buscar(db, post_id)
    if post.autor_id != eu.id:
        raise HTTPException(status_code=403, detail="só o autor pode mexer neste post")
    return post


def editar(db: Session, eu: User, post_id: int, dados: PostUpdate) -> PostOut:
    post = _post_do_autor(db, eu, post_id)
    campos = dados.model_dump(exclude_unset=True)
    _exigir_habilidade(db, campos.get("habilidade_id"))
    for nome, valor in campos.items():
        setattr(post, nome, valor)
    db.commit()
    db.refresh(post)
    return montar_saidas(db, eu, [post])[0]


def apagar(db: Session, eu: User, post_id: int) -> None:
    post = _post_do_autor(db, eu, post_id)
    db.execute(delete(Curtida).where(Curtida.post_id == post.id))
    db.delete(post)
    db.commit()