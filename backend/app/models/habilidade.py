from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Habilidade(Base):
    __tablename__ = "habilidades"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    categoria: Mapped[str] = mapped_column(String(20))
