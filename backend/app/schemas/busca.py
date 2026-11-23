from typing import Literal

from pydantic import BaseModel

from app.schemas.post import PostOut
from app.schemas.troca import HabilidadeResumo
from app.schemas.user import UserOut

TipoBusca = Literal["pessoas", "posts", "habilidades"]


class HabilidadeEncontrada(HabilidadeResumo):
    sabem: int
    querem: int


class ResultadoBusca(BaseModel):
    tipo: TipoBusca
    pessoas: list[UserOut] = []
    posts: list[PostOut] = []
    habilidades: list[HabilidadeEncontrada] = []
    total: int
    offset: int
    limit: int


class DetalheHabilidade(BaseModel):
    habilidade: HabilidadeResumo
    sabem: list[UserOut]
    querem: list[UserOut]
    posts: list[PostOut]
