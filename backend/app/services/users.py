from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.contadores import contador_iniciais
from app.models.habilidade import Habilidade
from app.models.post import Post
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.schemas.post import PostOut, PostPage
from app.schemas.user import HabilidadePerfilOut, PerfilOut, PerfilUpdate, UserCreate
from app.services import avaliacoes, follows, posts, streak


def listar(db: Session, offset: int, limit: int) -> tuple[list[User], int]:
    total = db.scalar(select(func.count()).select_from(User)) or 0
    users = list(
        db.scalars(
            select(User).order_by(User.username).offset(offset).limit(limit)
        )
    )
    return users, total


def criar_usuario(
    db: Session,
    *,
    username: str,
    name: str,
    password_hash: str = "",
    bio: str = "",
    avatar_url: str = "",
) -> User:
    ja_existe = db.scalar(select(User.id).where(User.username == username))
    if ja_existe is not None:
        raise HTTPException(status_code=409, detail="username já existe")

    user = User(
        username=username,
        name=name,
        bio=bio,
        avatar_url=avatar_url,
        password_hash=password_hash,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="username já existe")

    db.refresh(user)
    contador_iniciais.incrementar(user.username)
    return user


def criar(db: Session, dados: UserCreate) -> User:
    return criar_usuario(
        db,
        username=dados.username,
        name=dados.name,
        bio=dados.bio,
        avatar_url=dados.avatar_url,
    )


def _buscar_por_username(db: Session, username: str) -> User:
    usuario = db.scalar(select(User).where(User.username == username))
    if usuario is None:
        raise HTTPException(status_code=404, detail="pessoa não encontrada")
    return usuario


def _habilidades_do_usuario(db: Session, usuario_id: int) -> list[HabilidadePerfilOut]:
    rows = db.execute(
        select(UserHabilidade, Habilidade)
        .join(Habilidade, UserHabilidade.habilidade_id == Habilidade.id)
        .where(UserHabilidade.usuario_id == usuario_id)
        .order_by(UserHabilidade.tipo, Habilidade.nome)
    ).all()
    return [
        HabilidadePerfilOut(
            id=habilidade.id,
            nome=habilidade.nome,
            categoria=habilidade.categoria,
            tipo=relacao.tipo,
            nivel=relacao.nivel,
        )
        for relacao, habilidade in rows
    ]


def perfil(db: Session, username: str) -> PerfilOut:
    usuario = _buscar_por_username(db, username)
    contadores = follows.contadores(db, usuario.id)
    media, total = avaliacoes.media_e_total(db, usuario.id)
    return PerfilOut(
        id=usuario.id,
        username=usuario.username,
        name=usuario.name,
        bio=usuario.bio,
        avatar_url=usuario.avatar_url,
        created_at=usuario.created_at,
        seguidores=contadores.seguidores,
        seguindo=contadores.seguindo,
        streak=streak.streak_do_usuario(db, usuario.id),
        media_avaliacoes=media,
        total_avaliacoes=total,
        habilidades=_habilidades_do_usuario(db, usuario.id),
    )


def atualizar_perfil(db: Session, usuario: User, dados: PerfilUpdate) -> PerfilOut:
    campos = dados.model_dump(exclude_unset=True)
    for nome, valor in campos.items():
        setattr(usuario, nome, valor)
    db.commit()
    db.refresh(usuario)
    return perfil(db, usuario.username)


def posts_do_usuario(
    db: Session, eu: User, username: str, offset: int, limit: int
) -> PostPage:
    alvo = _buscar_por_username(db, username)
    total = (
        db.scalar(select(func.count()).select_from(Post).where(Post.autor_id == alvo.id))
        or 0
    )
    rows = list(
        db.scalars(
            select(Post)
            .where(Post.autor_id == alvo.id)
            .order_by(Post.created_at.desc(), Post.id.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    items = posts.montar_saidas(db, eu, rows)
    return PostPage(
        items=items, total=total, offset=offset, limit=limit
    )
