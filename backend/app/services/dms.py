from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.models.mensagem import Mensagem
from app.models.user import User
from app.schemas.dm import MensagemCreate, MensagemOut, MensagemPage


def _destinatario(db: Session, username: str, eu: User) -> User:
    outro = db.scalar(select(User).where(User.username == username))
    if outro is None:
        raise HTTPException(status_code=404, detail="usuário não encontrado")
    if outro.id == eu.id:
        raise HTTPException(
            status_code=422, detail="você não pode mandar mensagem para si mesmo"
        )
    return outro


def _saida(mensagem: Mensagem, de_username: str, para_username: str) -> MensagemOut:
    return MensagemOut(
        id=mensagem.id,
        de_username=de_username,
        para_username=para_username,
        texto=mensagem.texto,
        em=mensagem.em,
    )


def enviar(db: Session, eu: User, username: str, dados: MensagemCreate) -> MensagemOut:
    outro = _destinatario(db, username, eu)
    mensagem = Mensagem(
        de_id=eu.id, para_id=outro.id, texto=dados.texto, em=agora_utc()
    )
    db.add(mensagem)
    db.commit()
    db.refresh(mensagem)
    return _saida(mensagem, eu.username, outro.username)


def listar(
    db: Session, eu: User, username: str, depois_de: int | None, limit: int
) -> MensagemPage:
    outro = _destinatario(db, username, eu)
    consulta = select(Mensagem).where(
        or_(
            (Mensagem.de_id == eu.id) & (Mensagem.para_id == outro.id),
            (Mensagem.de_id == outro.id) & (Mensagem.para_id == eu.id),
        )
    )
    if depois_de is not None:
        consulta = consulta.where(Mensagem.id > depois_de)
    consulta = consulta.order_by(Mensagem.id.desc() if depois_de is None else Mensagem.id.asc())
    mensagens = list(db.scalars(consulta.limit(limit)))
    if depois_de is None:
        mensagens.reverse()
    items = [
        _saida(
            mensagem,
            eu.username if mensagem.de_id == eu.id else outro.username,
            outro.username if mensagem.para_id == outro.id else eu.username,
        )
        for mensagem in mensagens
    ]
    return MensagemPage(items=items)
