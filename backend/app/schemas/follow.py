from pydantic import BaseModel

from app.schemas.user import UserOut


class EstadoFollow(BaseModel):
    seguindo: bool
    seguidores: int


class Contadores(BaseModel):
    seguidores: int
    seguindo: int


class ConexaoOut(UserOut):
    eu_sigo: bool | None


class ConexaoPage(BaseModel):
    items: list[ConexaoOut]
    total: int
    offset: int
    limit: int
