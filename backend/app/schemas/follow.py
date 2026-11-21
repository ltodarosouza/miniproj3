from pydantic import BaseModel


class EstadoFollow(BaseModel):
    seguindo: bool
    seguidores: int


class Contadores(BaseModel):
    seguidores: int
    seguindo: int
