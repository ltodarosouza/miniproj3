from typing import Literal

from pydantic import BaseModel

from app.schemas.tempo import DataHoraUtc
from app.schemas.user import UserOut

TipoNotificacao = Literal[
    "curtida",
    "comentario",
    "seguidor",
    "troca_proposta",
    "troca_confirmada",
    "troca_recusada",
    "avaliacao",
]


class NotificacaoOut(BaseModel):
    tipo: TipoNotificacao
    em: DataHoraUtc
    ator: UserOut
    post_id: int | None = None
    troca_id: int | None = None
    texto_curto: str
    lida: bool


class NotificacaoPage(BaseModel):
    items: list[NotificacaoOut]
    total: int
    offset: int
    limit: int


class NaoLidasOut(BaseModel):
    total: int
