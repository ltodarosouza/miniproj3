from datetime import datetime

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Troca(Base):
    __tablename__ = "trocas"
    __table_args__ = (
        CheckConstraint("status IN ('proposta', 'confirmada', 'recusada')"),
        CheckConstraint(
            "habilidade_ensino_id IS NOT NULL OR habilidade_aprendo_id IS NOT NULL"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    proposta_por_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    com_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    data_hora: Mapped[datetime] = mapped_column(index=True)
    link_meet: Mapped[str] = mapped_column(String(300), default="")
    habilidade_ensino_id: Mapped[int | None] = mapped_column(
        ForeignKey("habilidades.id"), default=None
    )
    habilidade_aprendo_id: Mapped[int | None] = mapped_column(
        ForeignKey("habilidades.id"), default=None
    )
    status: Mapped[str] = mapped_column(String(20), default="proposta")
    criada_em: Mapped[datetime] = mapped_column(default=agora_utc)
    respondida_em: Mapped[datetime | None] = mapped_column(default=None)
