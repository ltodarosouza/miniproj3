from datetime import datetime

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Curtida(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("usuario_id", "post_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=agora_utc)
