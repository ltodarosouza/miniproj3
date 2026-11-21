from sqlalchemy import CheckConstraint, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class UserHabilidade(Base):
    __tablename__ = "user_habilidades"
    __table_args__ = (
        UniqueConstraint("usuario_id", "habilidade_id", "tipo"),
        CheckConstraint("nivel BETWEEN 1 AND 5"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    habilidade_id: Mapped[int] = mapped_column(ForeignKey("habilidades.id"), index=True)
    tipo: Mapped[str] = mapped_column(String(20))
    nivel: Mapped[int] = mapped_column(default=1)
