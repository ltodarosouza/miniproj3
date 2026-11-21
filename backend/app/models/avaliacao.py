from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Avaliacao(Base):
    __tablename__ = "avaliacoes"
    __table_args__ = (
        UniqueConstraint("troca_id", "de_id"),
        CheckConstraint("estrelas BETWEEN 1 AND 5"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    troca_id: Mapped[int] = mapped_column(ForeignKey("trocas.id"), index=True)
    de_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    para_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    estrelas: Mapped[int]
    feedback: Mapped[str] = mapped_column(String(500), default="")
    em: Mapped[datetime] = mapped_column(default=agora_utc)
