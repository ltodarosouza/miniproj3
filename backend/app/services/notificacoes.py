import base64
import json
import re
import secrets
from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.tempo import agora_utc, para_utc_ingenuo
from app.models.avaliacao import Avaliacao
from app.models.comentario import Comentario
from app.models.curtida import Curtida
from app.models.follow import Follow
from app.models.leitura_notificacoes import LeituraNotificacoes
from app.models.notificacao_entregue import NotificacaoEntregue
from app.models.post import Post
from app.models.troca import Troca
from app.models.user import User
from app.schemas.notificacao import NaoLidasOut, NotificacaoOut, NotificacaoPage
from app.schemas.user import UserOut


def _item(
    tipo: str,
    em: datetime,
    ator_id: int,
    post_id: int | None = None,
    troca_id: int | None = None,
    quantidade: int = 1,
    chave: int = 0,
) -> dict:
    return {
        "tipo": tipo,
        "em": em,
        "ator_id": ator_id,
        "post_id": post_id,
        "troca_id": troca_id,
        "texto_curto": "",
        "quantidade": quantidade,
        "chave": chave,
    }


def _montar(
    db: Session,
    pessoa: User,
    ate: datetime | None = None,
    inclusivo: bool = True,
) -> list[dict]:
    itens: list[dict] = []

    def dentro(coluna):
        if ate is None:
            return None
        return coluna <= ate if inclusivo else coluna < ate

    condicoes = [Post.autor_id == pessoa.id, Curtida.usuario_id != pessoa.id]
    if (filtro := dentro(Curtida.created_at)) is not None:
        condicoes.append(filtro)
    curtidas = list(
        db.scalars(
            select(Curtida)
            .join(Post, Curtida.post_id == Post.id)
            .where(*condicoes)
        )
    )
    grupos: dict[tuple[int, date], list[Curtida]] = {}
    for curtida in curtidas:
        chave = (curtida.post_id, curtida.created_at.date())
        grupos.setdefault(chave, []).append(curtida)
    for (post_id, _), grupo in grupos.items():
        ultima = max(grupo, key=lambda item: item.created_at)
        itens.append(
            _item(
                "curtida",
                ultima.created_at,
                ultima.usuario_id,
                post_id=post_id,
                quantidade=len(grupo),
                chave=post_id,
            )
        )

    condicoes = [Post.autor_id == pessoa.id, Comentario.autor_id != pessoa.id]
    if (filtro := dentro(Comentario.created_at)) is not None:
        condicoes.append(filtro)
    comentarios = db.scalars(
        select(Comentario)
        .join(Post, Comentario.post_id == Post.id)
        .where(*condicoes)
    )
    for comentario in comentarios:
        itens.append(
            _item(
                "comentario",
                comentario.created_at,
                comentario.autor_id,
                post_id=comentario.post_id,
                chave=comentario.id,
            )
        )

    condicoes = [Follow.seguido_id == pessoa.id, Follow.seguidor_id != pessoa.id]
    if (filtro := dentro(Follow.em)) is not None:
        condicoes.append(filtro)
    follows = db.scalars(select(Follow).where(*condicoes))
    for follow in follows:
        itens.append(_item("seguidor", follow.em, follow.seguidor_id, chave=0))

    condicoes = [Troca.com_id == pessoa.id, Troca.proposta_por_id != pessoa.id]
    if (filtro := dentro(Troca.criada_em)) is not None:
        condicoes.append(filtro)
    trocas_propostas = db.scalars(select(Troca).where(*condicoes))
    for troca in trocas_propostas:
        itens.append(
            _item(
                "troca_proposta",
                troca.criada_em,
                troca.proposta_por_id,
                troca_id=troca.id,
                chave=troca.id,
            )
        )

    condicoes = [
        Troca.proposta_por_id == pessoa.id,
        Troca.com_id != pessoa.id,
        Troca.status.in_(("confirmada", "recusada")),
        Troca.respondida_em.is_not(None),
    ]
    if (filtro := dentro(Troca.respondida_em)) is not None:
        condicoes.append(filtro)
    trocas_respondidas = db.scalars(select(Troca).where(*condicoes))
    for troca in trocas_respondidas:
        tipo = f"troca_{troca.status}"
        itens.append(
            _item(
                tipo,
                troca.respondida_em,
                troca.com_id,
                troca_id=troca.id,
                chave=troca.id,
            )
        )

    condicoes = [Avaliacao.para_id == pessoa.id, Avaliacao.de_id != pessoa.id]
    if (filtro := dentro(Avaliacao.em)) is not None:
        condicoes.append(filtro)
    avaliacoes = db.scalars(select(Avaliacao).where(*condicoes))
    for avaliacao in avaliacoes:
        itens.append(
            _item(
                "avaliacao",
                avaliacao.em,
                avaliacao.de_id,
                troca_id=avaliacao.troca_id,
                chave=avaliacao.id,
            )
        )

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
        item.pop("quantidade", None)

    leitura = db.scalar(
        select(LeituraNotificacoes).where(
            LeituraNotificacoes.usuario_id == pessoa.id
        )
    )
    lidas_ate = leitura.lidas_ate if leitura else None
    return [
        {**item, "lida": lidas_ate is not None and item["em"] <= lidas_ate}
        for item in itens
    ]


def _ordenar(itens: list[dict]) -> None:
    itens.sort(key=lambda item: item["pos"][1:])
    itens.sort(key=lambda item: item["pos"][0], reverse=True)


def _codificar_cursor(recorte: datetime, sequencia: str, item: dict) -> str:
    em, tipo, ator_id, chave = item["pos"]
    dados = {
        "r": recorte.isoformat(),
        "s": sequencia,
        "em": em.isoformat(),
        "t": tipo,
        "a": ator_id,
        "k": chave,
    }
    bruto = json.dumps(dados, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(bruto).rstrip(b"=").decode()


def _decodificar_cursor(cursor: str) -> dict:
    try:
        if re.fullmatch(r"[A-Za-z0-9_-]+", cursor) is None or len(cursor) % 4 == 1:
            raise ValueError
        bruto = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        dados = json.loads(bruto)
        if not isinstance(dados, dict) or set(dados) != {"r", "s", "em", "t", "a", "k"}:
            raise ValueError
        recorte = datetime.fromisoformat(dados["r"])
        em = datetime.fromisoformat(dados["em"])
        if recorte.tzinfo is not None or em.tzinfo is not None:
            raise ValueError
        if (
            not isinstance(dados["t"], str)
            or not isinstance(dados["s"], str)
            or re.fullmatch(r"[0-9a-f]{16}", dados["s"]) is None
            or type(dados["a"]) is not int
            or type(dados["k"]) is not int
        ):
            raise ValueError
        return {
            "r": recorte,
            "s": dados["s"],
            "em": em,
            "t": dados["t"],
            "a": dados["a"],
            "k": dados["k"],
        }
    except Exception as exc:
        raise HTTPException(status_code=422, detail="cursor inválido") from exc


def _carregar_entregues(
    db: Session, usuario_id: int, sequencia: str
) -> dict[tuple[int, date], tuple[datetime, int]]:
    return {
        (linha.post_id, linha.dia): (linha.em, linha.ator_id)
        for linha in db.scalars(
            select(NotificacaoEntregue).where(
                NotificacaoEntregue.usuario_id == usuario_id,
                NotificacaoEntregue.sequencia == sequencia,
            )
        )
    }


def _recortar(
    itens: list[dict],
    posicao: dict | None,
    antes_de: datetime | None,
    offset: int,
    limit: int,
    entregues: dict[tuple[int, date], tuple[datetime, int]],
) -> tuple[list[dict], bool]:
    for item in itens:
        item["pos"] = (item["em"], item["tipo"], item["ator_id"], item["chave"])
        if item["tipo"] == "curtida":
            guardado = entregues.get((item["chave"], item["em"].date()))
            if guardado:
                item["pos"] = (guardado[0], "curtida", guardado[1], item["chave"])
    ordenados = list(itens)
    _ordenar(ordenados)
    if posicao is not None:
        chave = (posicao["t"], posicao["a"], posicao["k"])
        ordenados = [
            item
            for item in ordenados
            if item["pos"][0] < posicao["em"]
            or (item["pos"][0] == posicao["em"] and item["pos"][1:] > chave)
        ]
        inicio = 0
    else:
        inicio = 0 if antes_de is not None else offset
    pagina = ordenados[inicio : inicio + limit]
    return pagina, len(ordenados) > inicio + len(pagina)


def _gravar_entregues(
    db: Session,
    usuario_id: int,
    sequencia: str,
    recorte: datetime,
    pagina: list[dict],
) -> None:
    linhas = [
        {
            "usuario_id": usuario_id,
            "sequencia": sequencia,
            "recorte": recorte,
            "post_id": item["chave"],
            "dia": item["em"].date(),
            "em": item["pos"][0],
            "ator_id": item["pos"][2],
        }
        for item in pagina
        if item["tipo"] == "curtida"
    ]
    if not linhas:
        return
    inserir = pg_insert if db.get_bind().dialect.name == "postgresql" else sqlite_insert
    db.execute(inserir(NotificacaoEntregue).values(linhas).on_conflict_do_nothing())


def listar(
    db: Session,
    pessoa: User,
    offset: int,
    limit: int,
    cursor: str | None = None,
    antes_de: datetime | None = None,
) -> NotificacaoPage:
    if cursor is not None and antes_de is not None:
        raise HTTPException(status_code=422, detail="use cursor ou antes_de, não os dois")
    posicao = _decodificar_cursor(cursor) if cursor is not None else None
    if posicao is not None:
        recorte = posicao["r"]
        sequencia = posicao["s"]
        itens = _montar(db, pessoa, ate=recorte, inclusivo=True)
    elif antes_de is not None:
        sequencia = secrets.token_hex(8)
        try:
            antes_de = para_utc_ingenuo(antes_de)
        except (OverflowError, ValueError) as exc:
            raise HTTPException(status_code=422, detail="antes_de inválido") from exc
        itens = _montar(db, pessoa, ate=antes_de, inclusivo=False)
        recorte = antes_de
    else:
        sequencia = secrets.token_hex(8)
        recorte = agora_utc()
        itens = _montar(db, pessoa, ate=recorte)
    limpeza_pendente = posicao is None and antes_de is None
    if limpeza_pendente:
        db.execute(
            delete(NotificacaoEntregue).where(
                NotificacaoEntregue.usuario_id == pessoa.id,
                NotificacaoEntregue.recorte < agora_utc() - timedelta(days=1),
            )
        )
    total = len(itens)
    entregues = _carregar_entregues(db, pessoa.id, sequencia)
    pagina, tem_mais = _recortar(itens, posicao, antes_de, offset, limit, entregues)
    proximo = None
    if pagina and tem_mais:
        recorte_cursor = (
            antes_de - timedelta(microseconds=1) if antes_de is not None else recorte
        )
        for tentativa in range(3):
            _gravar_entregues(db, pessoa.id, sequencia, recorte_cursor, pagina)
            db.commit()
            entregues = _carregar_entregues(db, pessoa.id, sequencia)
            divergente = any(
                (item["pos"][0], item["pos"][2])
                != entregues.get((item["chave"], item["em"].date()))
                for item in pagina
                if item["tipo"] == "curtida"
            )
            if not divergente:
                proximo = _codificar_cursor(recorte_cursor, sequencia, pagina[-1])
                break
            if tentativa == 2:
                raise HTTPException(status_code=409, detail="notificações mudaram; tente de novo")
            pagina, tem_mais = _recortar(itens, posicao, antes_de, offset, limit, entregues)
            if not tem_mais or not pagina:
                break
        if limpeza_pendente:
            db.commit()
    elif limpeza_pendente:
        db.commit()
    for item in pagina:
        item.pop("ator_id", None)
        item.pop("chave", None)
    return NotificacaoPage(
        items=[
            NotificacaoOut.model_validate(item) for item in pagina
        ],
        total=total,
        offset=0 if cursor is not None or antes_de is not None else offset,
        limit=limit,
        proximo_cursor=proximo,
    )


def nao_lidas(db: Session, pessoa: User) -> NaoLidasOut:
    itens = _montar(db, pessoa)
    return NaoLidasOut(
        total=sum(not item["lida"] for item in itens),
        ultima_em=max((item["em"] for item in itens), default=None),
    )


def marcar_lidas(db: Session, pessoa: User) -> None:
    agora = agora_utc()
    resultado = db.execute(
        update(LeituraNotificacoes)
        .where(
            LeituraNotificacoes.usuario_id == pessoa.id,
            LeituraNotificacoes.lidas_ate < agora,
        )
        .values(lidas_ate=agora)
    )
    if resultado.rowcount == 0 and db.scalar(
        select(LeituraNotificacoes).where(
            LeituraNotificacoes.usuario_id == pessoa.id
        )
    ) is None:
        db.add(LeituraNotificacoes(usuario_id=pessoa.id, lidas_ate=agora))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            db.execute(
                update(LeituraNotificacoes)
                .where(
                    LeituraNotificacoes.usuario_id == pessoa.id,
                    LeituraNotificacoes.lidas_ate < agora,
                )
                .values(lidas_ate=agora)
            )
            db.commit()
        return
    db.commit()
