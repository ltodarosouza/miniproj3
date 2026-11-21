from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.follow import Follow
from app.models.user import User
from app.schemas.follow import ConexaoOut, ConexaoPage, Contadores, EstadoFollow
from app.schemas.user import UserOut


def _buscar(db: Session, username: str) -> User:
    usuario = db.scalar(select(User).where(User.username == username))
    if usuario is None:
        raise HTTPException(status_code=404, detail="pessoa não encontrada")
    return usuario


def _total_seguidores(db: Session, usuario_id: int) -> int:
    return (
        db.scalar(
            select(func.count(Follow.id)).where(Follow.seguido_id == usuario_id)
        )
        or 0
    )


def contadores(db: Session, usuario_id: int) -> Contadores:
    seguindo = (
        db.scalar(
            select(func.count(Follow.id)).where(Follow.seguidor_id == usuario_id)
        )
        or 0
    )
    return Contadores(seguidores=_total_seguidores(db, usuario_id), seguindo=seguindo)


def segue(db: Session, seguidor_id: int, seguido_id: int) -> bool:
    return (
        db.scalar(
            select(Follow.id).where(
                Follow.seguidor_id == seguidor_id, Follow.seguido_id == seguido_id
            )
        )
        is not None
    )


def estado(db: Session, pessoa: User, username: str) -> EstadoFollow:
    alvo = _buscar(db, username)
    return EstadoFollow(
        seguindo=segue(db, pessoa.id, alvo.id),
        seguidores=_total_seguidores(db, alvo.id),
    )


def seguir(db: Session, pessoa: User, username: str) -> EstadoFollow:
    alvo = _buscar(db, username)
    if alvo.id == pessoa.id:
        raise HTTPException(status_code=422, detail="não dá para seguir a si mesmo")
    if not segue(db, pessoa.id, alvo.id):
        db.add(Follow(seguidor_id=pessoa.id, seguido_id=alvo.id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    return EstadoFollow(seguindo=True, seguidores=_total_seguidores(db, alvo.id))


def deixar_de_seguir(db: Session, pessoa: User, username: str) -> EstadoFollow:
    alvo = _buscar(db, username)
    db.execute(
        delete(Follow).where(
            Follow.seguidor_id == pessoa.id, Follow.seguido_id == alvo.id
        )
    )
    db.commit()
    return EstadoFollow(seguindo=False, seguidores=_total_seguidores(db, alvo.id))


def _ids_que_sigo(db: Session, pessoa: User | None, ids: list[int]) -> set[int] | None:
    if pessoa is None:
        return None
    if not ids:
        return set()
    return set(
        db.scalars(
            select(Follow.seguido_id).where(
                Follow.seguidor_id == pessoa.id, Follow.seguido_id.in_(ids)
            )
        )
    )


def _listar(
    db: Session,
    username: str,
    de_seguidores: bool,
    pessoa: User | None,
    offset: int,
    limit: int,
) -> ConexaoPage:
    alvo = _buscar(db, username)
    if de_seguidores:
        coluna_filtro, coluna_outro = Follow.seguido_id, Follow.seguidor_id
    else:
        coluna_filtro, coluna_outro = Follow.seguidor_id, Follow.seguido_id
    total = (
        db.scalar(select(func.count(Follow.id)).where(coluna_filtro == alvo.id)) or 0
    )
    usuarios = list(
        db.scalars(
            select(User)
            .join(Follow, coluna_outro == User.id)
            .where(coluna_filtro == alvo.id)
            .order_by(Follow.em.desc(), Follow.id.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    sigo = _ids_que_sigo(db, pessoa, [u.id for u in usuarios])
    return ConexaoPage(
        items=[
            ConexaoOut(
                **UserOut.model_validate(u).model_dump(),
                eu_sigo=None if sigo is None else u.id in sigo,
            )
            for u in usuarios
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


def seguidores(
    db: Session, username: str, pessoa: User | None, offset: int, limit: int
) -> ConexaoPage:
    return _listar(db, username, True, pessoa, offset, limit)


def seguindo(
    db: Session, username: str, pessoa: User | None, offset: int, limit: int
) -> ConexaoPage:
    return _listar(db, username, False, pessoa, offset, limit)
