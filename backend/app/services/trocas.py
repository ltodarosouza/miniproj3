from datetime import timedelta
from urllib.parse import urlencode

from fastapi import HTTPException
from sqlalchemy import or_, select, update
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc, como_utc
from app.models.habilidade import Habilidade
from app.models.troca import Troca
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.schemas.match import HabilidadeComNivel
from app.schemas.troca import HabilidadeResumo, OpcoesTroca, TrocaCreate, TrocaOut
from app.schemas.user import UserOut


def link_google_agenda(
    troca: Troca,
    proposta_por: User,
    com: User,
    habilidade_ensino: Habilidade | None,
    habilidade_aprendo: Habilidade | None,
) -> str:
    nomes = [
        habilidade.nome
        for habilidade in (habilidade_ensino, habilidade_aprendo)
        if habilidade is not None
    ]
    texto = "Troca: " + " ↔ ".join(nomes)
    detalhes = []
    if habilidade_ensino:
        detalhes.append(
            f"@{proposta_por.username} ensina {habilidade_ensino.nome} para @{com.username}"
        )
    if habilidade_aprendo:
        detalhes.append(
            f"@{com.username} ensina {habilidade_aprendo.nome} para @{proposta_por.username}"
        )
    if troca.link_meet:
        detalhes.append(f"Meet: {troca.link_meet}")
    inicio = como_utc(troca.data_hora)
    fim = inicio + timedelta(hours=1)
    formato = "%Y%m%dT%H%M%SZ"
    parametros = {
        "action": "TEMPLATE",
        "text": texto,
        "dates": f"{inicio.strftime(formato)}/{fim.strftime(formato)}",
        "details": "\n".join(detalhes),
    }
    if troca.link_meet:
        parametros["location"] = troca.link_meet
    return "https://calendar.google.com/calendar/render?" + urlencode(parametros)


def para_saida(db: Session, troca: Troca) -> TrocaOut:
    saidas = para_saidas(db, [troca])
    return saidas[0]


def para_saidas(db: Session, trocas: list[Troca]) -> list[TrocaOut]:
    if not trocas:
        return []
    user_ids = {id for troca in trocas for id in (troca.proposta_por_id, troca.com_id)}
    habilidade_ids = {
        id
        for troca in trocas
        for id in (troca.habilidade_ensino_id, troca.habilidade_aprendo_id)
        if id is not None
    }
    usuarios = {
        usuario.id: usuario
        for usuario in db.scalars(select(User).where(User.id.in_(user_ids)))
    }
    habilidades = (
        {
            habilidade.id: habilidade
            for habilidade in db.scalars(
                select(Habilidade).where(Habilidade.id.in_(habilidade_ids))
            )
        }
        if habilidade_ids
        else {}
    )
    saidas = []
    for troca in trocas:
        proposta_por = usuarios[troca.proposta_por_id]
        com = usuarios[troca.com_id]
        habilidade_ensino = habilidades.get(troca.habilidade_ensino_id)
        habilidade_aprendo = habilidades.get(troca.habilidade_aprendo_id)
        saidas.append(
            TrocaOut(
                id=troca.id,
                proposta_por=UserOut.model_validate(proposta_por),
                com=UserOut.model_validate(com),
                data_hora=troca.data_hora,
                link_meet=troca.link_meet,
                habilidade_ensino=(
                    HabilidadeResumo.model_validate(habilidade_ensino)
                    if habilidade_ensino
                    else None
                ),
                habilidade_aprendo=(
                    HabilidadeResumo.model_validate(habilidade_aprendo)
                    if habilidade_aprendo
                    else None
                ),
                status=troca.status,
                criada_em=troca.criada_em,
                respondida_em=troca.respondida_em,
                link_google_agenda=link_google_agenda(
                    troca,
                    proposta_por,
                    com,
                    habilidade_ensino,
                    habilidade_aprendo,
                ),
            )
        )
    return saidas


def criar(db: Session, pessoa: User, dados: TrocaCreate) -> TrocaOut:
    com = db.scalar(select(User).where(User.username == dados.com_username))
    if com is None:
        raise HTTPException(status_code=404, detail="pessoa não encontrada")
    if com.id == pessoa.id:
        raise HTTPException(status_code=422, detail="não é possível propor para si")
    if dados.data_hora <= agora_utc():
        raise HTTPException(status_code=422, detail="escolha um horário no futuro")
    ids = {
        id
        for id in (dados.habilidade_ensino_id, dados.habilidade_aprendo_id)
        if id is not None
    }
    existentes = set(db.scalars(select(Habilidade.id).where(Habilidade.id.in_(ids))))
    if existentes != ids:
        raise HTTPException(status_code=422, detail="habilidade não encontrada")
    if (
        dados.habilidade_ensino_id is not None
        and dados.habilidade_ensino_id == dados.habilidade_aprendo_id
    ):
        raise HTTPException(status_code=422, detail="escolha habilidades diferentes")
    troca = Troca(
        proposta_por_id=pessoa.id,
        com_id=com.id,
        data_hora=dados.data_hora,
        habilidade_ensino_id=dados.habilidade_ensino_id,
        habilidade_aprendo_id=dados.habilidade_aprendo_id,
        status="proposta",
    )
    db.add(troca)
    db.commit()
    db.refresh(troca)
    return para_saida(db, troca)


def responder(db: Session, pessoa: User, troca_id: int, status: str) -> TrocaOut:
    troca = db.get(Troca, troca_id)
    if troca is None or pessoa.id not in (troca.proposta_por_id, troca.com_id):
        raise HTTPException(status_code=404, detail="troca não encontrada")
    if pessoa.id == troca.proposta_por_id:
        raise HTTPException(
            status_code=403, detail="só quem recebeu a proposta pode responder"
        )
    alteradas = db.execute(
        update(Troca)
        .where(Troca.id == troca_id, Troca.status == "proposta")
        .values(status=status, respondida_em=agora_utc())
    ).rowcount
    if alteradas == 0:
        db.rollback()
        raise HTTPException(status_code=409, detail="esta proposta já foi respondida")
    db.commit()
    db.refresh(troca)
    return para_saida(db, troca)


def listar(db: Session, pessoa: User, com_username: str | None) -> list[TrocaOut]:
    consulta = select(Troca).where(
        or_(Troca.proposta_por_id == pessoa.id, Troca.com_id == pessoa.id)
    )
    if com_username is not None:
        com = db.scalar(select(User).where(User.username == com_username))
        if com is None:
            raise HTTPException(status_code=404, detail="pessoa não encontrada")
        consulta = consulta.where(
            or_(
                (Troca.proposta_por_id == pessoa.id) & (Troca.com_id == com.id),
                (Troca.proposta_por_id == com.id) & (Troca.com_id == pessoa.id),
            )
        )
    agora = agora_utc()
    futuras = db.scalars(
        consulta.where(Troca.data_hora >= agora).order_by(Troca.data_hora, Troca.id)
    )
    passadas = db.scalars(
        consulta.where(Troca.data_hora < agora).order_by(
            Troca.data_hora.desc(), Troca.id.desc()
        )
    )
    return para_saidas(db, [*futuras, *passadas])


def _habilidades_por_tipo(db: Session, usuario_id: int) -> dict[str, dict[int, tuple[str, int]]]:
    por_tipo: dict[str, dict[int, tuple[str, int]]] = {"sei": {}, "quero_aprender": {}}
    linhas = db.execute(
        select(UserHabilidade.tipo, Habilidade.id, Habilidade.nome, UserHabilidade.nivel)
        .join(Habilidade, Habilidade.id == UserHabilidade.habilidade_id)
        .where(UserHabilidade.usuario_id == usuario_id)
    )
    for tipo, habilidade_id, nome, nivel in linhas:
        por_tipo[tipo][habilidade_id] = (nome, nivel)
    return por_tipo


def _em_comum(
    quem_sabe: dict[int, tuple[str, int]], quem_quer: dict[int, tuple[str, int]]
) -> list[HabilidadeComNivel]:
    itens = [
        HabilidadeComNivel(id=habilidade_id, nome=nome, nivel=nivel)
        for habilidade_id, (nome, nivel) in quem_sabe.items()
        if habilidade_id in quem_quer
    ]
    return sorted(itens, key=lambda h: (-h.nivel, h.nome))


def opcoes(db: Session, pessoa: User, com_username: str) -> OpcoesTroca:
    com = db.scalar(select(User).where(User.username == com_username))
    if com is None:
        raise HTTPException(status_code=404, detail="pessoa não encontrada")
    if com.id == pessoa.id:
        raise HTTPException(status_code=422, detail="não é possível propor para si")
    minhas = _habilidades_por_tipo(db, pessoa.id)
    dela = _habilidades_por_tipo(db, com.id)
    return OpcoesTroca(
        eu_ensino=_em_comum(minhas["sei"], dela["quero_aprender"]),
        eu_aprendo=_em_comum(dela["sei"], minhas["quero_aprender"]),
    )
