from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    autor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    texto: Mapped[str] = mapped_column(String(1000))
    habilidade_id: Mapped[int | None] = mapped_column(
        ForeignKey("habilidades.id"), default=None
    )
    minutos_estudados: Mapped[int | None] = mapped_column(default=None)
    imagem_url: Mapped[str | None] = mapped_column(String(300), default=None)
    created_at: Mapped[datetime] = mapped_column(default=agora_utc, index=True)