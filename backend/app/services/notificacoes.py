from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc
from app.models.avaliacao import Avaliacao
from app.models.comentario import Comentario
from app.models.curtida import Curtida
from app.models.follow import Follow
from app.models.leitura_notificacoes import LeituraNotificacoes
from app.models.post import Post
from app.models.troca import Troca
from app.models.user import User
from app.schemas.notificacao import NaoLidasOut, NotificacaoOut, NotificacaoPage
from app.schemas.user import UserOut


def _montar(db: Session, pessoa: User) -> list[dict]:
    itens: list[dict] = []
    curtidas = list(
        db.execute(
            select(Curtida, Post.autor_id)
            .join(Post, Curtida.post_id == Post.id)
            .where(Post.autor_id == pessoa.id, Curtida.usuario_id != pessoa.id)
        )
    )
    grupos: dict[tuple[int, date], list[Curtida]] = {}
    for curtida, _ in curtidas:
        grupos.setdefault((curtida.post_id, curtida.created_at.date()), []).append(curtida)
    for (post_id, _), grupo in grupos.items():
        ultima = max(grupo, key=lambda item: item.created_at)
        itens.append({
            "tipo": "curtida",
            "em": ultima.created_at,
            "ator_id": ultima.usuario_id,
            "post_id": post_id,
            "troca_id": None,
            "texto_curto": "",
            "quantidade": len(grupo),
        })

    comentarios = db.scalars(
        select(Comentario)
        .join(Post, Comentario.post_id == Post.id)
        .where(Post.autor_id == pessoa.id, Comentario.autor_id != pessoa.id)
    )
    for comentario in comentarios:
        itens.append({"tipo": "comentario", "em": comentario.created_at,
                      "ator_id": comentario.autor_id, "post_id": comentario.post_id,
                      "troca_id": None, "texto_curto": ""})

    follows = db.scalars(
        select(Follow).where(Follow.seguido_id == pessoa.id, Follow.seguidor_id != pessoa.id)
    )
    for follow in follows:
        itens.append({"tipo": "seguidor", "em": follow.em, "ator_id": follow.seguidor_id,
                      "post_id": None, "troca_id": None, "texto_curto": ""})

    trocas_propostas = db.scalars(select(Troca).where(Troca.com_id == pessoa.id,
                                                       Troca.proposta_por_id != pessoa.id))
    for troca in trocas_propostas:
        itens.append({"tipo": "troca_proposta", "em": troca.criada_em,
                      "ator_id": troca.proposta_por_id, "post_id": None,
                      "troca_id": troca.id, "texto_curto": ""})

    trocas_respondidas = db.scalars(
        select(Troca).where(Troca.proposta_por_id == pessoa.id, Troca.com_id != pessoa.id,
                            Troca.status.in_(("confirmada", "recusada")),
                            Troca.respondida_em.is_not(None))
    )
    for troca in trocas_respondidas:
        tipo = f"troca_{troca.status}"
        itens.append({"tipo": tipo, "em": troca.respondida_em, "ator_id": troca.com_id,
                      "post_id": None, "troca_id": troca.id, "texto_curto": ""})

    avaliacoes = db.scalars(
        select(Avaliacao).where(Avaliacao.para_id == pessoa.id, Avaliacao.de_id != pessoa.id)
    )
    for avaliacao in avaliacoes:
        itens.append({"tipo": "avaliacao", "em": avaliacao.em, "ator_id": avaliacao.de_id,
                      "post_id": None, "troca_id": avaliacao.troca_id, "texto_curto": ""})

    ator_ids = {item["ator_id"] for item in itens}
    atores = {
        ator.id: UserOut.model_validate(ator)
        for ator in db.scalars(select(User).where(User.id.in_(ator_ids)))
    } if ator_ids else {}
    textos = {
        "comentario": "comentou no seu post",
        "seguidor": "começou a seguir você",
        "troca_proposta": "propôs uma troca",
        "troca_confirmada": "confirmou a troca",
        "troca_recusada": "recusou a troca",
        "avaliacao": "avaliou a troca com você",
    }
    for item in itens:
        ator = atores[item["ator_id"]]
        if item["tipo"] == "curtida":
            quantidade = item["quantidade"]
            item["texto_curto"] = (
                f"{ator.name} curtiu seu post" if quantidade == 1
                else f"{ator.name} e mais {quantidade - 1} curtiram seu post"
            )
        else:
            item["texto_curto"] = f"{ator.name} {textos[item['tipo']]}"
        item["ator"] = ator
        item.pop("ator_id")
        item.pop("quantidade", None)

    leitura = db.scalar(select(LeituraNotificacoes).where(LeituraNotificacoes.usuario_id == pessoa.id))
    lidas_ate = leitura.lidas_ate if leitura else None
    return [
        {**item, "lida": lidas_ate is not None and item["em"] <= lidas_ate}
        for item in itens
    ]


def listar(db: Session, pessoa: User, offset: int, limit: int) -> NotificacaoPage:
    itens = _montar(db, pessoa)
    itens.sort(key=lambda item: item["em"], reverse=True)
    return NotificacaoPage(
        items=[NotificacaoOut.model_validate(item) for item in itens[offset:offset + limit]],
        total=len(itens),
        offset=offset,
        limit=limit,
    )


def nao_lidas(db: Session, pessoa: User) -> NaoLidasOut:
    return NaoLidasOut(total=sum(not item["lida"] for item in _montar(db, pessoa)))


def marcar_lidas(db: Session, pessoa: User) -> None:
    leitura = db.scalar(select(LeituraNotificacoes).where(LeituraNotificacoes.usuario_id == pessoa.id))
    if leitura is None:
        leitura = LeituraNotificacoes(usuario_id=pessoa.id, lidas_ate=agora_utc())
        db.add(leitura)
    else:
        leitura.lidas_ate = agora_utc()
    db.commit()
