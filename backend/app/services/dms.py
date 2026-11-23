from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import case, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.models.leitura_conversa import LeituraConversa
from app.models.mensagem import Mensagem
from app.models.troca import Troca
from app.models.user import User
from app.schemas.dm import (
    ConversaOut,
    ConversaPage,
    LidasOut,
    MensagemCreate,
    MensagemOut,
    MensagemPage,
    NaoLidasOut,
)


def _destinatario(db: Session, username: str, eu: User) -> User:
    outro = db.scalar(select(User).where(User.username == username))
    if outro is None:
        raise HTTPException(status_code=404, detail="usuário não encontrado")
    if outro.id == eu.id:
        raise HTTPException(
            status_code=422, detail="você não pode mandar mensagem para si mesmo"
        )
    return outro


def _entregar(db: Session, eu: User) -> None:
    db.execute(
        update(Mensagem)
        .where(Mensagem.para_id == eu.id, Mensagem.entregue_em.is_(None))
        .values(entregue_em=agora_utc())
    )
    db.commit()


def _saida(mensagem: Mensagem, de_username: str, para_username: str) -> MensagemOut:
    return MensagemOut(
        id=mensagem.id,
        de_username=de_username,
        para_username=para_username,
        texto=mensagem.texto,
        em=mensagem.em,
        entregue_em=mensagem.entregue_em,
        lida_em=mensagem.lida_em,
    )


def _lidas_ate_id(db: Session, eu: User, outro: User) -> int | None:
    return db.scalar(
        select(func.max(Mensagem.id)).where(
            Mensagem.de_id == eu.id,
            Mensagem.para_id == outro.id,
            Mensagem.lida_em.is_not(None),
        )
    )


def enviar(db: Session, eu: User, username: str, dados: MensagemCreate) -> MensagemOut:
    outro = _destinatario(db, username, eu)
    mensagem = Mensagem(de_id=eu.id, para_id=outro.id, texto=dados.texto, em=agora_utc())
    db.add(mensagem)
    db.commit()
    db.refresh(mensagem)
    return _saida(mensagem, eu.username, outro.username)


def listar(
    db: Session, eu: User, username: str, depois_de: int | None, limit: int
) -> MensagemPage:
    outro = _destinatario(db, username, eu)
    _entregar(db, eu)
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
    return MensagemPage(
        items=[
            _saida(
                mensagem,
                eu.username if mensagem.de_id == eu.id else outro.username,
                outro.username if mensagem.para_id == outro.id else eu.username,
            )
            for mensagem in mensagens
        ],
        lidas_ate_id=_lidas_ate_id(db, eu, outro),
    )


def marcar_lidas(db: Session, eu: User, username: str) -> LidasOut:
    outro = _destinatario(db, username, eu)
    agora = agora_utc()
    db.execute(
        update(Mensagem)
        .where(
            Mensagem.de_id == outro.id,
            Mensagem.para_id == eu.id,
            Mensagem.lida_em.is_(None),
        )
        .values(lida_em=agora, entregue_em=func.coalesce(Mensagem.entregue_em, agora))
    )
    db.commit()
    atualizada = db.execute(
        update(LeituraConversa)
        .where(
            LeituraConversa.user_id == eu.id,
            LeituraConversa.com_id == outro.id,
            LeituraConversa.lida_em < agora,
        )
        .values(lida_em=agora)
    )
    if atualizada.rowcount == 0 and db.scalar(
        select(LeituraConversa).where(
            LeituraConversa.user_id == eu.id,
            LeituraConversa.com_id == outro.id,
        )
    ) is None:
        db.add(LeituraConversa(user_id=eu.id, com_id=outro.id, lida_em=agora))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            db.execute(
                update(LeituraConversa)
                .where(
                    LeituraConversa.user_id == eu.id,
                    LeituraConversa.com_id == outro.id,
                    LeituraConversa.lida_em < agora,
                )
                .values(lida_em=agora)
            )
            db.commit()
    else:
        db.commit()
    return LidasOut(lidas_ate_id=_lidas_ate_id(db, eu, outro))


def _contagens_nao_lidas(db: Session, eu: User) -> dict[int, int]:
    contagens: dict[int, int] = {}
    for pessoa_id, total in db.execute(
        select(Mensagem.de_id, func.count(Mensagem.id))
        .where(
            Mensagem.para_id == eu.id,
            Mensagem.lida_em.is_(None),
        )
        .group_by(Mensagem.de_id)
    ):
        contagens[pessoa_id] = total
    propostas = select(
        Troca.proposta_por_id.label("pessoa_id"), func.count(Troca.id).label("total")
    ).outerjoin(
        LeituraConversa,
        (LeituraConversa.user_id == eu.id)
        & (LeituraConversa.com_id == Troca.proposta_por_id),
    ).where(
        Troca.com_id == eu.id,
        Troca.status == "proposta",
        or_(LeituraConversa.lida_em.is_(None), Troca.criada_em > LeituraConversa.lida_em),
    ).group_by(Troca.proposta_por_id)
    for pessoa_id, total in db.execute(propostas):
        contagens[pessoa_id] = contagens.get(pessoa_id, 0) + total
    return contagens


def nao_lidas(db: Session, eu: User) -> NaoLidasOut:
    _entregar(db, eu)
    contagens = _contagens_nao_lidas(db, eu)
    usuarios = {
        pessoa.id: pessoa.username
        for pessoa in db.scalars(select(User).where(User.id.in_(contagens)))
    } if contagens else {}
    por_conversa = {usuarios[pessoa_id]: total for pessoa_id, total in contagens.items() if total}
    return NaoLidasOut(total=sum(por_conversa.values()), por_conversa=por_conversa)


def listar_conversas(db: Session, eu: User) -> ConversaPage:
    _entregar(db, eu)
    menor_id_mensagem = case(
        (Mensagem.de_id < Mensagem.para_id, Mensagem.de_id),
        else_=Mensagem.para_id,
    )
    maior_id_mensagem = case(
        (Mensagem.de_id < Mensagem.para_id, Mensagem.para_id),
        else_=Mensagem.de_id,
    )
    ultimas_mensagens = (
        select(
            Mensagem.id.label("mensagem_id"),
            func.row_number()
            .over(
                partition_by=(menor_id_mensagem, maior_id_mensagem),
                order_by=(Mensagem.em.desc(), Mensagem.id.desc()),
            )
            .label("posicao"),
        )
        .where(or_(Mensagem.de_id == eu.id, Mensagem.para_id == eu.id))
        .subquery()
    )
    mensagens = list(
        db.scalars(
            select(Mensagem)
            .join(ultimas_mensagens, Mensagem.id == ultimas_mensagens.c.mensagem_id)
            .where(ultimas_mensagens.c.posicao == 1)
        )
    )
    menor_id_troca = case(
        (Troca.proposta_por_id < Troca.com_id, Troca.proposta_por_id),
        else_=Troca.com_id,
    )
    maior_id_troca = case(
        (Troca.proposta_por_id < Troca.com_id, Troca.com_id),
        else_=Troca.proposta_por_id,
    )
    instante_troca = func.coalesce(Troca.respondida_em, Troca.criada_em)
    ultimas_trocas = (
        select(
            Troca.id.label("troca_id"),
            func.row_number()
            .over(
                partition_by=(menor_id_troca, maior_id_troca),
                order_by=(instante_troca.desc(), Troca.id.desc()),
            )
            .label("posicao"),
        )
        .where(or_(Troca.proposta_por_id == eu.id, Troca.com_id == eu.id))
        .subquery()
    )
    trocas = list(
        db.scalars(
            select(Troca)
            .join(ultimas_trocas, Troca.id == ultimas_trocas.c.troca_id)
            .where(ultimas_trocas.c.posicao == 1)
        )
    )
    eventos: dict[int, tuple[datetime, int, str, Mensagem | Troca]] = {}
    for mensagem in mensagens:
        outro_id = mensagem.para_id if mensagem.de_id == eu.id else mensagem.de_id
        eventos.setdefault(outro_id, (mensagem.em, 0, "mensagem", mensagem))
    for troca in trocas:
        outro_id = troca.com_id if troca.proposta_por_id == eu.id else troca.proposta_por_id
        instante = troca.respondida_em or troca.criada_em
        atual = eventos.get(outro_id)
        if atual is None or instante >= atual[0]:
            eventos[outro_id] = (instante, 1, f"troca_{troca.status}", troca)
    outros_ids = set(eventos)
    usuarios = {
        usuario.id: usuario
        for usuario in db.scalars(select(User).where(User.id.in_(outros_ids)))
    } if outros_ids else {}
    contagens = _contagens_nao_lidas(db, eu)
    itens = []
    for outro_id, (instante, _, tipo, evento) in eventos.items():
        if tipo == "mensagem":
            mensagem = evento
            ultima_mensagem = mensagem.texto
            ultima_de_mim = mensagem.de_id == eu.id
            troca_data_hora = None
        else:
            troca = evento
            ultima_mensagem = ""
            ultima_de_mim = troca.proposta_por_id == eu.id if troca.status == "proposta" else troca.com_id == eu.id
            troca_data_hora = troca.data_hora
        itens.append(
            ConversaOut(
                com=usuarios[outro_id],
                ultima_mensagem=ultima_mensagem,
                ultima_de_mim=ultima_de_mim,
                em=instante,
                ultimo_evento=tipo,
                troca_data_hora=troca_data_hora,
                nao_lidas=contagens.get(outro_id, 0),
            )
        )
    itens.sort(key=lambda item: item.em, reverse=True)
    return ConversaPage(items=itens)
