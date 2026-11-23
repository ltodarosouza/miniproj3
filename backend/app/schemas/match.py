from pydantic import BaseModel

from app.schemas.user import UserOut


class HabilidadeComNivel(BaseModel):
    id: int
    nome: str
    nivel: int


class MatchOut(BaseModel):
    usuario: UserOut
    me_ensina: list[HabilidadeComNivel]
    eu_ensino: list[HabilidadeComNivel]


class Matches(BaseModel):
    troca: list[MatchOut]
    pode_te_ensinar: list[MatchOut]
    em_andamento: list[MatchOut]
