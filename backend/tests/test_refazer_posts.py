import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

import bcrypt
import pytest
from sqlalchemy import create_engine, event, insert, select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

import refazer_posts
from app.db import SessionLocal
from app.db import Base
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
        likes_antes = sorted((x.id, x.usuario_id, x.post_id, x.created_at) for x in db.scalars(select(Curtida)))
        comentarios_antes = sorted((x.id, x.post_id, x.autor_id, x.texto, x.created_at) for x in db.scalars(select(Comentario)))
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
        assert sorted((x.id, x.usuario_id, x.post_id, x.created_at) for x in db.scalars(select(Curtida))) == likes_antes
        assert sorted((x.id, x.post_id, x.autor_id, x.texto, x.created_at) for x in db.scalars(select(Comentario))) == comentarios_antes


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


def test_username_fora_do_seed_bio_seed_e_senha_seed_e_bot(client):
    with SessionLocal() as db:
        seed.seed_fake(db)
        db.add(User(
            username="bot_bio_antigo", name="Bot Bio", bio="monitor nas horas vagas",
            password_hash=bcrypt.hashpw(seed.SENHA_SEED.encode(), bcrypt.gensalt()).decode(),
        ))
        db.commit()
        assert "bot_bio_antigo" in {u.username for u in refazer_posts.encontrar_bots(db)}


def test_bio_vazia_e_senha_seed_nao_e_bot(client):
    with SessionLocal() as db:
        seed.seed_fake(db)
    resposta = client.post(
        "/auth/registro",
        json={"username": "real_sem_bio", "name": "Real Sem Bio", "password": seed.SENHA_SEED},
    )
    assert resposta.status_code == 201
    with SessionLocal() as db:
        usuario = db.scalar(select(User).where(User.username == "real_sem_bio"))
        assert usuario.bio in (None, "")
        assert "real_sem_bio" not in {u.username for u in refazer_posts.encontrar_bots(db)}


def test_bio_seed_com_outra_senha_nao_e_bot(client):
    with SessionLocal() as db:
        seed.seed_fake(db)
        db.add(User(
            username="real_bio_conhecida", name="Real", bio="monitor nas horas vagas",
            password_hash=bcrypt.hashpw(b"outra-senha-456", bcrypt.gensalt()).decode(),
        ))
        db.commit()
        assert "real_bio_conhecida" not in {u.username for u in refazer_posts.encontrar_bots(db)}


def test_restaurar_com_foreign_keys_ativas(tmp_path):
    motor = create_engine(f"sqlite:///{tmp_path / 'fk.db'}")

    @event.listens_for(motor, "connect")
    def habilitar_chaves(conexao, _):
        conexao.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(motor)
    backup = tmp_path / "fk.json"
    try:
        with Session(motor) as db:
            seed.seed_fake(db)
            bot = next(u for u in refazer_posts.encontrar_bots(db) if u.username != "ada")
            post = db.scalar(select(Post).where(Post.autor_id == bot.id))
            db.add(Comentario(post_id=post.id, autor_id=bot.id, texto="comentário teste"))
            db.commit()
            refazer_posts.refazer(db, "bots", backup)
            refazer_posts.restaurar(db, backup)
            assert db.scalar(select(Comentario.texto).where(Comentario.texto == "comentário teste"))
    finally:
        motor.dispose()


def test_backup_existente_nao_e_sobrescrito(client, tmp_path):
    with SessionLocal() as db:
        seed.seed_fake(db)
        caminho = tmp_path / "backup.json"
        refazer_posts.refazer(db, "bots", caminho)
        conteudo = caminho.read_bytes()
        posts = list(db.scalars(select(Post.id).order_by(Post.id)))
        try:
            refazer_posts.refazer(db, "bots", caminho)
        except SystemExit as erro:
            assert "já existe" in str(erro)
        else:
            raise AssertionError("backup existente deveria ser recusado")
        assert caminho.read_bytes() == conteudo
        assert list(db.scalars(select(Post.id).order_by(Post.id))) == posts


def test_travar_tabelas_sqlite_roda_sem_erro(client):
    with SessionLocal() as db:
        refazer_posts._travar_tabelas(db)


def test_travar_tabelas_sqlite_bloqueia_escritor(tmp_path):
    motor = create_engine(f"sqlite:///{tmp_path / 'lock.db'}", connect_args={"timeout": 0.5})
    Base.metadata.create_all(motor)
    try:
        with Session(motor) as db:
            seed.seed_fake(db)
            post = db.scalar(select(Post))
            db.commit()
            refazer_posts._travar_tabelas(db)
            with motor.connect() as conexao_b:
                with pytest.raises(OperationalError, match="locked"):
                    conexao_b.execute(insert(Curtida).values(usuario_id=999999, post_id=post.id))
            db.rollback()
            with motor.begin() as conexao_b:
                conexao_b.execute(insert(Curtida).values(usuario_id=999999, post_id=post.id))
    finally:
        motor.dispose()


def test_restaurar_preserva_posts_e_interacoes_posteriores(client, logar, tmp_path):
    post_real, post_bot = _montar(client, logar)
    backup = tmp_path / "posterior.json"
    with SessionLocal() as db:
        likes_backup = [(x.usuario_id, x.post_id, x.created_at) for x in db.scalars(select(Curtida).order_by(Curtida.id))]
        comentarios_backup = [(x.post_id, x.autor_id, x.texto, x.created_at) for x in db.scalars(select(Comentario).order_by(Comentario.id))]
        refazer_posts.refazer(db, "bots", backup)
        real = db.scalar(select(User).where(User.username == "pessoa_real"))
        db.add(Curtida(usuario_id=real.id, post_id=post_real))
        db.add(Comentario(post_id=post_real, autor_id=real.id, texto="comentário posterior"))
        db.commit()
        refazer_posts.restaurar(db, backup)
        likes_atuais = [(x.usuario_id, x.post_id, x.created_at) for x in db.scalars(select(Curtida).order_by(Curtida.id))]
        comentarios_atuais = [(x.post_id, x.autor_id, x.texto, x.created_at) for x in db.scalars(select(Comentario).order_by(Comentario.id))]
        assert (real.id, post_real) in [(u, p) for u, p, _ in likes_atuais]
        assert (post_real, real.id, "comentário posterior") in [(p, a, t) for p, a, t, _ in comentarios_atuais]
        assert set(likes_backup).issubset(set(likes_atuais))
        assert set(comentarios_backup).issubset(set(comentarios_atuais))
        assert db.get(Post, post_bot) is not None


def test_restaurar_todos_preserva_post_criado_depois(client, logar, tmp_path):
    _montar(client, logar)
    backup = tmp_path / "todos-posterior.json"
    with SessionLocal() as db:
        refazer_posts.refazer(db, "todos", backup)
        pessoa = db.scalar(select(User).where(User.username == "pessoa_real"))
        posterior = Post(autor_id=pessoa.id, texto="post após escopo todos")
        db.add(posterior)
        db.commit()
        id_posterior = posterior.id
        refazer_posts.restaurar(db, backup)
        assert db.get(Post, id_posterior) is not None


def test_restaurar_sem_lista_de_novos_nao_altera(client, tmp_path):
    backup = tmp_path / "sem-novos.json"
    backup.write_text('{"tabelas": {"posts": []}}')
    with SessionLocal() as db:
        seed.seed_fake(db)
        antes = list(db.scalars(select(Post.id).order_by(Post.id)))
        try:
            refazer_posts.restaurar(db, backup)
        except SystemExit as erro:
            assert ".novos.json" in str(erro)
        else:
            raise AssertionError("restauração sem manifesto deveria ser recusada")
        assert list(db.scalars(select(Post.id).order_by(Post.id))) == antes


def test_restaurar_nao_apaga_post_posterior_que_reaproveitou_id(client, logar, tmp_path):
    _montar(client, logar)
    backup = tmp_path / "reuso.json"
    with SessionLocal() as db:
        refazer_posts.refazer(db, "bots", backup)
        novos = __import__("json").loads(Path(str(backup) + ".novos.json").read_text())["posts_novos"]
        ultimo = max(item["id"] if isinstance(item, dict) else item for item in novos)
        refazer_posts.apagar_posts(db, [ultimo])
        db.commit()
        real = db.scalar(select(User).where(User.username == "pessoa_real"))
        posterior = Post(id=ultimo, autor_id=real.id, texto="post posterior com id reaproveitado")
        db.add(posterior)
        db.commit()
        refazer_posts.restaurar(db, backup)
        recuperado = db.get(Post, ultimo)
        assert recuperado is not None
        assert recuperado.texto == "post posterior com id reaproveitado"


def test_restaurar_descarta_post_gerado_mesmo_editado(client, logar, tmp_path):
    from app.schemas.post import PostUpdate
    from app.services import posts as servico_posts

    _montar(client, logar)
    backup = tmp_path / "editado.json"
    with SessionLocal() as db:
        antes = sorted(db.scalars(select(Post.id)))
        refazer_posts.refazer(db, "bots", backup)
        novos = __import__("json").loads(Path(str(backup) + ".novos.json").read_text())["posts_novos"]
        gerado = db.get(Post, novos[0]["id"])
        autor = db.get(User, gerado.autor_id)
        servico_posts.editar(db, autor, gerado.id, PostUpdate(texto="texto editado depois"))
        db.commit()
        refazer_posts.restaurar(db, backup)
        assert db.get(Post, gerado.id) is None
        assert sorted(db.scalars(select(Post.id))) == antes
