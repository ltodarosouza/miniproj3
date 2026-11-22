import sys
from pathlib import Path

from sqlalchemy import func, select

from app.core.matches import indice_matches
from app.db import SessionLocal
from app.models.avaliacao import Avaliacao
from app.models.mensagem import Mensagem
from app.models.troca import Troca
from app.models.user import User
from app.models.user_habilidade import UserHabilidade

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import seed  # noqa: E402


def rodar_seed():
    with SessionLocal() as db:
        seed.seed_fake(db)
        indice_matches.reconstruir(
            [(uh.usuario_id, uh.habilidade_id, uh.tipo) for uh in db.scalars(select(UserHabilidade))]
        )
        return list(db.scalars(select(User)))


def test_todo_usuario_do_seed_tem_match_de_troca(client):
    usuarios = rodar_seed()
    assert len(usuarios) >= 30
    sem_troca = [u.username for u in usuarios if not indice_matches.match_de_troca(u.id)]
    assert sem_troca == []


def test_seed_tem_conversas_e_trocas_avaliadas(client):
    rodar_seed()
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(Mensagem)) >= 20
        assert db.scalar(select(func.count()).select_from(Troca).where(Troca.status == "confirmada")) >= 5
        assert db.scalar(select(func.count()).select_from(Avaliacao)) >= 10


def test_seed_e_deterministico(client):
    primeira = [(u.username, u.name) for u in rodar_seed()]
    from app.db import Base, engine

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    segunda = [(u.username, u.name) for u in rodar_seed()]
    assert primeira == segunda


def test_usuario_do_seed_loga_e_ve_troca_no_endpoint(client):
    usuarios = rodar_seed()
    r = client.post("/auth/login", json={"username": usuarios[0].username, "password": seed.SENHA_SEED})
    assert r.status_code == 200
    token = r.json()["token"]
    corpo = client.get("/matches", headers={"Authorization": f"Bearer {token}"}).json()
    assert usuarios[1].username in [m["usuario"]["username"] for m in corpo["troca"]]
