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


def retrato_do_seed():
    from app.models.follow import Follow
    from app.models.post import Post

    rodar_seed()
    with SessionLocal() as db:
        return (
            [(u.username, u.name, u.bio) for u in db.scalars(select(User).order_by(User.id))],
            sorted((uh.usuario_id, uh.habilidade_id, uh.tipo, uh.nivel) for uh in db.scalars(select(UserHabilidade))),
            [(p.autor_id, p.texto, p.habilidade_id) for p in db.scalars(select(Post).order_by(Post.id))],
            sorted((f.seguidor_id, f.seguido_id) for f in db.scalars(select(Follow))),
            [(t.proposta_por_id, t.com_id, t.status) for t in db.scalars(select(Troca).order_by(Troca.id))],
        )


def test_seed_e_deterministico(client):
    from app.db import Base, engine

    primeira = retrato_do_seed()
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    assert retrato_do_seed() == primeira


def test_usuario_do_seed_loga_e_ve_troca_no_endpoint(client):
    usuarios = rodar_seed()
    r = client.post("/auth/login", json={"username": usuarios[0].username, "password": seed.SENHA_SEED})
    assert r.status_code == 200
    token = r.json()["token"]
    corpo = client.get("/matches", headers={"Authorization": f"Bearer {token}"}).json()
    par = next(m for m in corpo["troca"] + corpo["em_andamento"] if m["usuario"]["username"] == usuarios[1].username)
    assert par["eu_ensino"]


def test_seed_tem_streak_de_varios_dias(client):
    from app.services.streak import streak_do_usuario

    usuarios = rodar_seed()
    with SessionLocal() as db:
        maior = max(streak_do_usuario(db, u.id) for u in usuarios)
    assert maior >= 4


def test_ninguem_curte_o_proprio_post(client):
    from app.models.curtida import Curtida
    from app.models.post import Post

    rodar_seed()
    with SessionLocal() as db:
        proprias = db.scalar(
            select(func.count())
            .select_from(Curtida)
            .join(Post, Post.id == Curtida.post_id)
            .where(Post.autor_id == Curtida.usuario_id)
        )
    assert proprias == 0
