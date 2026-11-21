import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

import app.models  # noqa: F401
from app.db import Base, SessionLocal, engine
from app.models.habilidade import Habilidade
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.services.habilidades import CATALOGO, garantir_catalogo


def preparar_banco() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)


def test_catalogo_e_idempotente():
    preparar_banco()
    with SessionLocal() as db:
        garantir_catalogo(db)
        garantir_catalogo(db)
        total = db.scalar(select(func.count()).select_from(Habilidade))
    assert total == len(CATALOGO)


def test_usuario_nao_repete_habilidade_no_mesmo_tipo():
    preparar_banco()
    with SessionLocal() as db:
        usuario = User(username="ana", name="Ana")
        habilidade = Habilidade(nome="Python", categoria="tech")
        db.add_all([usuario, habilidade])
        db.commit()
        db.add_all(
            [
                UserHabilidade(
                    usuario_id=usuario.id,
                    habilidade_id=habilidade.id,
                    tipo="sei",
                ),
                UserHabilidade(
                    usuario_id=usuario.id,
                    habilidade_id=habilidade.id,
                    tipo="sei",
                ),
            ]
        )
        with pytest.raises(IntegrityError):
            db.commit()
