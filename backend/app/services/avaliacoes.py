from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.models.avaliacao import Avaliacao
from app.models.troca import Troca
from app.models.user import User
from app.schemas.avaliacao import AvaliacaoCreate, AvaliacaoOut, ResumoAvaliacoes
from app.schemas.troca import TrocaOut
from app.schemas.user import UserOut
from app.services.trocas import para_saidas


def _para_saida(db: Session, avaliacao: Avaliacao) -> AvaliacaoOut:
    de = db.get(User, avaliacao.de_id)
    para = db.get(User, avaliacao.para_id)
    return AvaliacaoOut(
        id=avaliacao.id,
        troca_id=avaliacao.troca_id,
        de=UserOut.model_validate(de),
        para=UserOut.model_validate(para),
        estrelas=avaliacao.estrelas,
        feedback=avaliacao.feedback,
        em=avaliacao.em,
    )


def pendentes(db: Session, pessoa: User) -> list[TrocaOut]:
    ja_avaliou = select(Avaliacao.id).where(
        Avaliacao.troca_id == Troca.id,
        Avaliacao.de_id == pessoa.id,
    )
    trocas = list(
        db.scalars(
            select(Troca)
            .where(
                (Troca.proposta_por_id == pessoa.id) | (Troca.com_id == pessoa.id),
                Troca.status == "confirmada",
                Troca.data_hora <= agora_utc(),
                ~ja_avaliou.exists(),
            )
            .order_by(Troca.data_hora)
        )
    )
    return para_saidas(db, trocas)


def avaliar(
    db: Session, pessoa: User, troca_id: int, dados: AvaliacaoCreate
) -> AvaliacaoOut:
    troca = db.get(Troca, troca_id)
    if troca is None:
        raise HTTPException(status_code=404, detail="troca não encontrada")
    if pessoa.id not in (troca.proposta_por_id, troca.com_id):
        raise HTTPException(status_code=403, detail="você não participou desta troca")
    if troca.status != "confirmada":
        raise HTTPException(
            status_code=409, detail="só dá para avaliar uma troca confirmada"
        )
    if troca.data_hora > agora_utc():
        raise HTTPException(status_code=409, detail="a troca ainda não aconteceu")
    existente = db.scalar(
        select(Avaliacao.id).where(
            Avaliacao.troca_id == troca_id, Avaliacao.de_id == pessoa.id
        )
    )
    if existente is not None:
        raise HTTPException(status_code=409, detail="você já avaliou esta troca")
    para_id = troca.com_id if pessoa.id == troca.proposta_por_id else troca.proposta_por_id
    avaliacao = Avaliacao(
        troca_id=troca_id,
        de_id=pessoa.id,
        para_id=para_id,
        estrelas=dados.estrelas,
        feedback=dados.feedback,
    )
    db.add(avaliacao)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="você já avaliou esta troca")
    db.refresh(avaliacao)
    return _para_saida(db, avaliacao)


def resumo(db: Session, username: str) -> ResumoAvaliacoes:
    usuario = db.scalar(select(User).where(User.username == username))
    if usuario is None:
        raise HTTPException(status_code=404, detail="pessoa não encontrada")
    avaliacoes = list(
        db.scalars(
            select(Avaliacao)
            .where(Avaliacao.para_id == usuario.id)
            .order_by(Avaliacao.em.desc(), Avaliacao.id.desc())
            .limit(50)
        )
    )
    total = db.scalar(
        select(func.count(Avaliacao.id)).where(Avaliacao.para_id == usuario.id)
    ) or 0
    media = round(sum(item.estrelas for item in avaliacoes) / len(avaliacoes), 1) if avaliacoes else None
    return ResumoAvaliacoes(
        media=media,
        total=total,
        items=[_para_saida(db, item) for item in avaliacoes],
    )


def media_e_total(db: Session, usuario_id: int) -> tuple[float | None, int]:
    media, total = db.execute(
        select(func.avg(Avaliacao.estrelas), func.count(Avaliacao.id)).where(
            Avaliacao.para_id == usuario_id
        )
    ).one()
    return (round(float(media), 1) if media is not None else None, total)
