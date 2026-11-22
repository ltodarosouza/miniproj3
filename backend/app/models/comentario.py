from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Comentario(Base):
    __tablename__ = "comentarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), index=True)
    autor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    texto: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(default=agora_utc)
