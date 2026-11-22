from pydantic import BaseModel, ConfigDict, Field


class HabilidadeResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    categoria: str


class HabilidadeMapearIn(BaseModel):
    texto: str = Field(min_length=1, max_length=80)


class HabilidadeMapearOut(BaseModel):
    habilidade: HabilidadeResumo | None
