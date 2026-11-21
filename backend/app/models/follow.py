from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("seguidor_id", "seguido_id", name="uq_follows_par"),
        CheckConstraint("seguidor_id <> seguido_id", name="ck_follows_nao_si_mesmo"),
        Index("ix_follows_seguido_em", "seguido_id", "em"),
        Index("ix_follows_seguidor_em", "seguidor_id", "em"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    seguidor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    seguido_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    em: Mapped[datetime] = mapped_column(default=agora_utc)
