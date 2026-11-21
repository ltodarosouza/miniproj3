from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.tempo import DataHoraUtc
from app.schemas.user import UserOut


class AvaliacaoCreate(BaseModel):
    estrelas: int = Field(ge=1, le=5)
    feedback: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] = ""


class AvaliacaoOut(BaseModel):
    id: int
    troca_id: int
    de: UserOut
    para: UserOut
    estrelas: int
    feedback: str
    em: DataHoraUtc


class ResumoAvaliacoes(BaseModel):
    media: float | None
    total: int
    items: list[AvaliacaoOut]
