from typing import Literal

from pydantic import BaseModel

from app.schemas.post import PostOut

Motivo = Literal["meu", "seguindo", "pode_te_ensinar", "descobrir"]


class ItemFeed(PostOut):
    motivo: Motivo


class FeedPage(BaseModel):
    items: list[ItemFeed]
    total: int
    offset: int
    limit: int


class HabilidadeEmAlta(BaseModel):
    id: int
    nome: str
    categoria: str
    posts: int
    minutos: int


class MeuProgresso(BaseModel):
    streak: int
    minutos_semana: int
    posts_semana: int
