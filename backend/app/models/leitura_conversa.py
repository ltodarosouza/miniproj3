from datetime import datetime

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class LeituraConversa(Base):
    __tablename__ = "leitura_conversas"
    __table_args__ = (UniqueConstraint("user_id", "com_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    com_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    lida_em: Mapped[datetime]
