import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import bcrypt
from sqlalchemy import select

import refazer_posts
from app.db import SessionLocal
from app.models.comentario import Comentario
from app.models.curtida import Curtida
from app.models.post import Post
from app.models.user import User
from scripts import seed


def _montar(client, logar):
    with SessionLocal() as db:
        seed.seed_fake(db)
    headers = logar("pessoa_real", "Pessoa Real")
    post_real = client.post("/posts", json={"texto": "post real"}, headers=headers).json()["id"]
    with SessionLocal() as db:
        bot = next(u for u in refazer_posts.encontrar_bots(db) if u.username != "ada")
    headers_bot = client.post("/auth/login", json={"username": bot.username, "password": seed.SENHA_SEED}).json()["token"]
    bot_headers = {"Authorization": f"Bearer {headers_bot}"}
    bot_post = client.post("/posts", json={"texto": "post para interações"}, headers=bot_headers).json()["id"]
    assert client.post(f"/posts/{bot_post}/curtir", headers=headers).status_code == 204
    assert client.post(f"/posts/{bot_post}/comentarios", json={"texto": "comentário real"}, headers=headers).status_code == 201
    return post_real, bot_post


def test_plano_nao_altera_banco(client):
    with SessionLocal() as db:
        seed.seed_fake(db)
        antes = list(db.scalars(select(Post.id).order_by(Post.id)))
        refazer_posts.plano(db, "bots")
        assert list(db.scalars(select(Post.id).order_by(Post.id))) == antes


def test_refazer_e_restaurar_preserva_dados_de_outros(client, logar, tmp_path):
    post_real, _ = _montar(client, logar)
    backup = tmp_path / "b.json"
    with SessionLocal() as db:
        posts_antes = [(p.id, p.autor_id, p.texto, p.imagem_url) for p in db.scalars(select(Post).order_by(Post.id))]
        likes_antes = [(x.id, x.usuario_id, x.post_id) for x in db.scalars(select(Curtida).order_by(Curtida.id))]
        comentarios_antes = [(x.id, x.autor_id, x.post_id, x.texto) for x in db.scalars(select(Comentario).order_by(Comentario.id))]
        resultado = refazer_posts.refazer(db, "bots", backup)
        assert backup.exists()
        assert db.get(Post, post_real) is not None
        autor_real = db.scalar(select(User.id).where(User.username == "pessoa_real"))
        # O SQLite pode reutilizar ROWIDs após apagar o maior id; valide que a
        # publicação antiga exclusiva do bot não permaneceu por conteúdo/autor.
        assert db.scalar(select(Post.id).where(Post.autor_id != autor_real, Post.texto == "post para interações")) is None
        novos = list(db.scalars(select(Post).where(Post.autor_id != db.scalar(select(User.id).where(User.username == "pessoa_real"))).order_by(Post.created_at, Post.id)))
        assert all((p.imagem_url is None) == (i % 2 == 0) for i, p in enumerate(novos))
        backup_json = __import__("json").loads(backup.read_text())
        assert any("post_id" in x for x in backup_json["tabelas"]["likes"])
        refazer_posts.restaurar(db, backup)
        assert [(p.id, p.autor_id, p.texto, p.imagem_url) for p in db.scalars(select(Post).order_by(Post.id))] == posts_antes
        assert [(x.id, x.usuario_id, x.post_id) for x in db.scalars(select(Curtida).order_by(Curtida.id))] == likes_antes
        assert [(x.id, x.autor_id, x.post_id, x.texto) for x in db.scalars(select(Comentario).order_by(Comentario.id))] == comentarios_antes


def test_refazer_todos_remove_posts_reais_sem_criar_para_real(client, logar, tmp_path):
    post_real, _ = _montar(client, logar)
    with SessionLocal() as db:
        refazer_posts.refazer(db, "todos", tmp_path / "todos.json")
        assert db.get(Post, post_real) is None
        real_id = db.scalar(select(User.id).where(User.username == "pessoa_real"))
        assert db.scalar(select(Post.id).where(Post.autor_id == real_id)) is None


def test_senha_diferente_nao_e_bot(client):
    with SessionLocal() as db:
        seed.seed_fake(db)
        usuario = db.scalar(select(User).where(User.username == "ada"))
        usuario.password_hash = bcrypt.hashpw(b"outra-senha-456", bcrypt.gensalt()).decode()
        db.commit()
        assert "ada" not in {u.username for u in refazer_posts.encontrar_bots(db)}


def test_main_sem_aplicar_avisa(client, capsys):
    refazer_posts.main(["--escopo", "bots"])
    assert "nada foi alterado" in capsys.readouterr().out


def test_refazer_apaga_post_real_escolhido_e_restaurar_preserva_outro(client, logar, tmp_path):
    primeiro, _ = _montar(client, logar)
    headers = {"Authorization": f"Bearer {client.post('/auth/login', json={'username': 'pessoa_real', 'password': 'senha-forte-123'}).json()['token']}"}
    segundo = client.post("/posts", json={"texto": "post real que fica"}, headers=headers).json()["id"]
    backup = tmp_path / "seletivo.json"

    with SessionLocal() as db:
        usuario_real = db.scalar(select(User.id).where(User.username == "pessoa_real"))
        refazer_posts.refazer(db, "bots", backup, posts_reais=[primeiro])
        assert db.get(Post, primeiro) is None
        assert db.get(Post, segundo).autor_id == usuario_real
        backup_json = __import__("json").loads(backup.read_text())
        assert backup_json["posts_reais"] == [primeiro]
        refazer_posts.restaurar(db, backup)
        assert db.get(Post, primeiro).autor_id == usuario_real
        assert db.get(Post, segundo).texto == "post real que fica"


def test_posts_reais_recusa_id_de_bot_e_inexistente_sem_alterar(client, tmp_path):
    with SessionLocal() as db:
        seed.seed_fake(db)
        bot_id = db.scalar(select(Post.id).join(User, User.id == Post.autor_id).where(User.username == "ada"))
        ids_antes = list(db.scalars(select(Post.id).order_by(Post.id)))
        for post_id in (bot_id, 999999):
            try:
                refazer_posts.refazer(db, "bots", tmp_path / f"{post_id}.json", [post_id])
            except SystemExit as erro:
                assert "inválidos" in str(erro)
            else:
                raise AssertionError("o id inválido deveria ser recusado")
            assert list(db.scalars(select(Post.id).order_by(Post.id))) == ids_antes
            assert not (tmp_path / f"{post_id}.json").exists()


def test_listar_reais_devolve_somente_posts_de_nao_bots(client, logar):
    real, _ = _montar(client, logar)
    with SessionLocal() as db:
        posts = refazer_posts.listar_reais(db)
        usernames_bots = {bot.username for bot in refazer_posts.encontrar_bots(db)}
        assert posts
        assert real in {post["id"] for post in posts}
        assert all(post["username"] not in usernames_bots for post in posts)
