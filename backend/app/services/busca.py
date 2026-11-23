"""Busca sem acento e sem diferença de maiúsculas.

O casefold sem acento é feito em Python (`normalizar`), igual para SQLite e
Postgres. Com o tamanho da rede da turma isso cabe folgado; ver decisão 19.
"""

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.catalogo import normalizar
from app.models.habilidade import Habilidade
from app.models.post import Post
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.schemas.busca import (
    DetalheHabilidade,
    HabilidadeEncontrada,
    ResultadoBusca,
    TipoBusca,
)
from app.schemas.troca import HabilidadeResumo
from app.schemas.user import UserOut
from app.services.posts import montar_saidas

POSTS_DA_HABILIDADE = 20


def _contem(termo: str, *textos: str | None) -> bool:
    return any(termo in normalizar(texto or "") for texto in textos)


def _pessoas(db: Session, termo: str) -> list[User]:
    usuarios = db.scalars(select(User).order_by(User.username))
    return [u for u in usuarios if _contem(termo, u.username, u.name, u.bio)]


def _posts(db: Session, termo: str) -> list[Post]:
    habilidades = {
        h.id for h in db.scalars(select(Habilidade)) if _contem(termo, h.nome)
    }
    posts = db.scalars(select(Post).order_by(Post.created_at.desc(), Post.id.desc()))
    return [p for p in posts if _contem(termo, p.texto) or p.habilidade_id in habilidades]


def _contagem_por_tipo(db: Session, ids: list[int]) -> dict[tuple[int, str], int]:
    return {
        (habilidade_id, tipo): total
        for habilidade_id, tipo, total in db.execute(
            select(UserHabilidade.habilidade_id, UserHabilidade.tipo, func.count())
            .where(UserHabilidade.habilidade_id.in_(ids))
            .group_by(UserHabilidade.habilidade_id, UserHabilidade.tipo)
        )
    }


def _habilidades(db: Session, termo: str) -> list[Habilidade]:
    achadas = [h for h in db.scalars(select(Habilidade)) if _contem(termo, h.nome)]
    # quem começa com o termo vem antes ("cálculo" antes de "pré-cálculo")
    return sorted(achadas, key=lambda h: (not normalizar(h.nome).startswith(termo), normalizar(h.nome)))


def buscar(
    db: Session, eu: User, q: str, tipo: TipoBusca, offset: int, limit: int
) -> ResultadoBusca:
    termo = normalizar(q.strip())
    vazio = ResultadoBusca(tipo=tipo, total=0, offset=offset, limit=limit)
    if not termo:
        return vazio
    fatia = slice(offset, offset + limit)

    if tipo == "pessoas":
        achados = _pessoas(db, termo)
        return vazio.model_copy(
            update={
                "pessoas": [UserOut.model_validate(u) for u in achados[fatia]],
                "total": len(achados),
            }
        )
    if tipo == "posts":
        achados = _posts(db, termo)
        return vazio.model_copy(
            update={"posts": montar_saidas(db, eu, achados[fatia]), "total": len(achados)}
        )

    achados = _habilidades(db, termo)
    pagina = achados[fatia]
    contagem = _contagem_por_tipo(db, [h.id for h in pagina])
    return vazio.model_copy(
        update={
            "habilidades": [
                HabilidadeEncontrada(
                    id=h.id,
                    nome=h.nome,
                    categoria=h.categoria,
                    sabem=contagem.get((h.id, "sei"), 0),
                    querem=contagem.get((h.id, "quero_aprender"), 0),
                )
                for h in pagina
            ],
            "total": len(achados),
        }
    )


def _usuarios_com(db: Session, habilidade_id: int, tipo: str) -> list[UserOut]:
    usuarios = db.scalars(
        select(User)
        .join(UserHabilidade, UserHabilidade.usuario_id == User.id)
        .where(UserHabilidade.habilidade_id == habilidade_id, UserHabilidade.tipo == tipo)
        .order_by(UserHabilidade.nivel.desc(), User.username)
    )
    return [UserOut.model_validate(u) for u in usuarios]


def detalhar_habilidade(db: Session, eu: User, habilidade_id: int) -> DetalheHabilidade:
    habilidade = db.get(Habilidade, habilidade_id)
    if habilidade is None:
        raise HTTPException(status_code=404, detail="habilidade não encontrada")
    posts = list(
        db.scalars(
            select(Post)
            .where(Post.habilidade_id == habilidade_id)
            .order_by(Post.created_at.desc(), Post.id.desc())
            .limit(POSTS_DA_HABILIDADE)
        )
    )
    return DetalheHabilidade(
        habilidade=HabilidadeResumo.model_validate(habilidade),
        sabem=_usuarios_com(db, habilidade_id, "sei"),
        querem=_usuarios_com(db, habilidade_id, "quero_aprender"),
        posts=montar_saidas(db, eu, posts),
    )
