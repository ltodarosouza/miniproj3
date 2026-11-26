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
            [(u.username, u.name, u.bio, u.avatar_url) for u in db.scalars(select(User).order_by(User.id))],
            sorted((uh.usuario_id, uh.habilidade_id, uh.tipo, uh.nivel) for uh in db.scalars(select(UserHabilidade))),
            [(p.autor_id, p.texto, p.habilidade_id, p.imagem_url) for p in db.scalars(select(Post).order_by(Post.id))],
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


def test_todo_usuario_do_seed_tem_avatar(client):
    usuarios = rodar_seed()
    avatares = [u.avatar_url for u in usuarios]
    assert all(url and url.startswith("https://randomuser.me/api/portraits/") for url in avatares)
    assert len(avatares) == len(set(avatares))


def test_posts_alternam_com_e_sem_foto(client):
    from app.models.post import Post

    rodar_seed()
    fotos_validas = {url for urls in seed.FOTOS_POR_TEMA.values() for url in urls}
    with SessionLocal() as db:
        posts = list(db.scalars(select(Post).order_by(Post.created_at, Post.id)))
    com_foto = [p for p in posts if p.imagem_url]
    assert 50 <= len(posts) <= 60
    assert len(com_foto) * 2 == len(posts)
    assert [bool(p.imagem_url) for p in posts] == [i % 2 == 1 for i in range(len(posts))]
    assert all(p.imagem_url in fotos_validas for p in com_foto)
    assert len({p.created_at for p in posts}) == len(posts)


def test_textos_do_seed_sao_curtos(client):
    from app.models.post import Post

    rodar_seed()
    with SessionLocal() as db:
        posts = list(db.scalars(select(Post)))
    assert all(len(post.texto) <= 90 for post in posts)


def test_fotos_seguidas_nao_se_repetem(client):
    from app.models.post import Post

    rodar_seed()
    with SessionLocal() as db:
        posts = list(db.scalars(select(Post).order_by(Post.created_at, Post.id)))
    fotos = [post.imagem_url for post in posts if post.imagem_url]
    assert all(a != b for a, b in zip(fotos, fotos[1:]))


def test_foto_do_post_combina_com_a_habilidade(client):
    from app.models.habilidade import Habilidade
    from app.models.post import Post
    from app.services.habilidades import CATALOGO

    rodar_seed()
    nomes_catalogo = {nome for nome, _categoria in CATALOGO}
    assert set(seed.TEMA_POR_HABILIDADE.values()) <= set(seed.FOTOS_POR_TEMA)
    assert set(seed.TEMA_POR_HABILIDADE) <= nomes_catalogo
    with SessionLocal() as db:
        posts = list(db.scalars(select(Post).where(Post.imagem_url.is_not(None))))
        habilidades = {h.id: h.nome for h in db.scalars(select(Habilidade))}
    for post in posts:
        nome = habilidades[post.habilidade_id] if post.habilidade_id is not None else None
        tema = seed.TEMA_POR_HABILIDADE.get(nome, "estudo")
        assert post.imagem_url in seed.FOTOS_POR_TEMA[tema]


def test_seed_tem_posts_recentes_com_foto(client):
    from datetime import timedelta

    from app.core.tempo import agora_utc
    from app.models.post import Post

    rodar_seed()
    agora = agora_utc()
    with SessionLocal() as db:
        recentes = db.scalar(
            select(func.count())
            .select_from(Post)
            .where(Post.imagem_url.is_not(None))
            .where(Post.created_at >= agora - timedelta(hours=48), Post.created_at <= agora)
        )
    assert recentes >= 4
