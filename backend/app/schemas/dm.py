from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.tempo import DataHoraUtc
from app.schemas.user import UserOut

TextoMensagem = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)
]


class MensagemCreate(BaseModel):
    texto: TextoMensagem


class MensagemOut(BaseModel):
    id: int
    de_username: str
    para_username: str
    texto: str
    em: DataHoraUtc
    entregue_em: DataHoraUtc | None
    lida_em: DataHoraUtc | None


class MensagemPage(BaseModel):
    items: list[MensagemOut]
    lidas_ate_id: int | None


class ConversaOut(BaseModel):
    com: UserOut
    ultima_mensagem: str
    ultima_de_mim: bool
    em: DataHoraUtc
    ultimo_evento: str
    troca_data_hora: DataHoraUtc | None
    nao_lidas: int


class ConversaPage(BaseModel):
    items: list[ConversaOut]


class NaoLidasOut(BaseModel):
    total: int
    por_conversa: dict[str, int]


class LidasOut(BaseModel):
    lidas_ate_id: int | None
