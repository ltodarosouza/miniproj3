from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LeituraNotificacoes(Base):
    __tablename__ = "leituras_notificacoes"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    lidas_ate: Mapped[datetime]
