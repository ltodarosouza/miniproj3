from typing import Literal

from pydantic import BaseModel

from app.schemas.post import PostOut


class ItemFeed(PostOut):
    motivo: Literal["seguindo", "pode_te_ensinar"]


class FeedPage(BaseModel):
    items: list[ItemFeed]
    total: int
    offset: int
    limit: int
