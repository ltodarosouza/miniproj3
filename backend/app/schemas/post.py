from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.tempo import DataHoraUtc
from app.schemas.troca import HabilidadeResumo
from app.schemas.user import UserOut

TextoPost = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)
]


class PostCreate(BaseModel):
    texto: TextoPost
    habilidade_id: int | None = None
    minutos_estudados: int | None = Field(default=None, ge=1, le=1440)


class PostOut(BaseModel):
    id: int
    autor: UserOut
    texto: str
    habilidade: HabilidadeResumo | None
    minutos_estudados: int | None
    imagem_url: str | None
    created_at: DataHoraUtc
    curtidas: int = 0