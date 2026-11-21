from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("seguidor_id", "seguido_id"),
        CheckConstraint("seguidor_id <> seguido_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    seguidor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    seguido_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    em: Mapped[datetime] = mapped_column(default=agora_utc)
