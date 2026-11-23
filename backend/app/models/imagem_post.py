from datetime import datetime

from sqlalchemy import ForeignKey, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class ImagemPost(Base):
    __tablename__ = "imagens_post"

    nome: Mapped[str] = mapped_column(String(40), primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(20))
    conteudo: Mapped[bytes] = mapped_column(LargeBinary)
    created_at: Mapped[datetime] = mapped_column(default=agora_utc)
