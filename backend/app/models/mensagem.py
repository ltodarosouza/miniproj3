from datetime import datetime

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.tempo import agora_utc
from app.db import Base


class Mensagem(Base):
    __tablename__ = "mensagens"
    __table_args__ = (
        Index("ix_mensagens_par", "de_id", "para_id", "id"),
        Index("uq_mensagens_de_cliente_id", "de_id", "cliente_id", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    de_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    para_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    texto: Mapped[str] = mapped_column(String(1000))
    cliente_id: Mapped[str | None] = mapped_column(String(64), default=None)
    em: Mapped[datetime] = mapped_column(default=agora_utc, index=True)
    entregue_em: Mapped[datetime | None] = mapped_column(default=None)
    lida_em: Mapped[datetime | None] = mapped_column(default=None)
