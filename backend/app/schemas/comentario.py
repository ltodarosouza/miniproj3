from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.tempo import DataHoraUtc
from app.schemas.user import UserOut

TextoComentario = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)
]


class ComentarioCreate(BaseModel):
    texto: TextoComentario


class ComentarioOut(BaseModel):
    id: int
    post_id: int
    autor: UserOut
    texto: str
    created_at: DataHoraUtc


class ComentarioPage(BaseModel):
    items: list[ComentarioOut]
    total: int
    offset: int
    limit: int
