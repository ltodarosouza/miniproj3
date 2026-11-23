from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.match import HabilidadeComNivel
from app.schemas.tempo import DataHoraEntrada, DataHoraUtc
from app.schemas.user import UserOut

StatusTroca = Literal["proposta", "confirmada", "recusada"]


class HabilidadeResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    categoria: str


class TrocaCreate(BaseModel):
    com_username: str = Field(min_length=1, max_length=30)
    data_hora: DataHoraEntrada
    habilidade_ensino_id: int | None = None
    habilidade_aprendo_id: int | None = None

    @model_validator(mode="after")
    def exige_uma_habilidade(self) -> "TrocaCreate":
        if self.habilidade_ensino_id is None and self.habilidade_aprendo_id is None:
            raise ValueError("escolha ao menos uma habilidade para a troca")
        return self


class OpcoesTroca(BaseModel):
    eu_ensino: list[HabilidadeComNivel]
    eu_aprendo: list[HabilidadeComNivel]


class TrocaOut(BaseModel):
    id: int
    proposta_por: UserOut
    com: UserOut
    data_hora: DataHoraUtc
    link_meet: str
    habilidade_ensino: HabilidadeResumo | None
    habilidade_aprendo: HabilidadeResumo | None
    status: StatusTroca
    criada_em: DataHoraUtc
    respondida_em: DataHoraUtc | None
    link_google_agenda: str


class TrocaPage(BaseModel):
    items: list[TrocaOut]
