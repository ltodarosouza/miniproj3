from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, field_validator

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


class PostUpdate(BaseModel):
    texto: TextoPost | None = None
    habilidade_id: int | None = None
    minutos_estudados: int | None = Field(default=None, ge=1, le=1440)

    @field_validator("texto")
    @classmethod
    def texto_nao_pode_ser_nulo(cls, valor: str | None) -> str | None:
        if valor is None:
            raise ValueError("texto não pode ser nulo")
        return valor


class PostOut(BaseModel):
    id: int
    autor: UserOut
    texto: str
    habilidade: HabilidadeResumo | None
    minutos_estudados: int | None
    imagem_url: str | None
    created_at: DataHoraUtc
    editado_em: DataHoraUtc | None = None
    curtidas: int = 0
    curtido: bool = False
    comentarios: int = 0


class PostPage(BaseModel):
    items: list[PostOut]
    total: int
    offset: int
    limit: int
