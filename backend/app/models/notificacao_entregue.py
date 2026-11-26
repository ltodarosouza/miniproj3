from datetime import date, datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class NotificacaoEntregue(Base):
    __tablename__ = "notificacoes_entregues"
    __table_args__ = (UniqueConstraint("usuario_id", "sequencia", "post_id", "dia"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sequencia: Mapped[str] = mapped_column(String(32))
    recorte: Mapped[datetime]
    post_id: Mapped[int]
    dia: Mapped[date]
    em: Mapped[datetime]
    ator_id: Mapped[int]
