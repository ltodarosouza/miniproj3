import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text

from app.db import normalizar_url

RAIZ = Path(__file__).resolve().parents[1]


def _alembic(url: str, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=RAIZ,
        env={**os.environ, "DATABASE_URL": url},
        capture_output=True,
        text=True,
    )


def test_normalizar_url_postgres():
    assert normalizar_url("postgres://u:s@h/db") == "postgresql+psycopg://u:s@h/db"
    assert (
        normalizar_url("postgresql://u:s@h/db?sslmode=require")
        == "postgresql+psycopg://u:s@h/db?sslmode=require"
    )
    assert normalizar_url("sqlite:///./app.db") == "sqlite:///./app.db"


def test_migracoes_cobrem_todos_os_modelos(tmp_path):
    url = f"sqlite:///{tmp_path / 'migracoes.db'}"

    subida = _alembic(url, "upgrade", "head")
    assert subida.returncode == 0, subida.stderr

    conferencia = _alembic(url, "check")
    assert conferencia.returncode == 0, (
        "Algum modelo mudou sem migração. Rode: make migracao m=\"o que mudou\"\n"
        + conferencia.stdout
        + conferencia.stderr
    )

    tabelas = set(inspect(create_engine(url)).get_table_names())
    assert {"users", "posts", "follows", "user_habilidades"} <= tabelas

    descida = _alembic(url, "downgrade", "base")
    assert descida.returncode == 0, descida.stderr
    assert set(inspect(create_engine(url)).get_table_names()) == {"alembic_version"}


def test_downgrade_da_0005_limpa_avatares_internos(tmp_path):
    url = f"sqlite:///{tmp_path / 'avatares.db'}"
    subida = _alembic(url, "upgrade", "head")
    assert subida.returncode == 0, subida.stderr

    engine = create_engine(url)
    with engine.begin() as conexao:
        conexao.execute(
            text("""
                INSERT INTO users
                    (id, username, name, bio, avatar_url, password_hash, created_at)
                VALUES
                    (1, 'interno', 'Interno', '', '/usuarios/avatares/abc.png', '', CURRENT_TIMESTAMP),
                    (2, 'externo', 'Externo', '', 'https://exemplo.com/a.png', '', CURRENT_TIMESTAMP)
            """)
        )
        conexao.execute(
            text("""
                INSERT INTO imagens_avatar (nome, usuario_id, tipo, conteudo, created_at)
                VALUES ('abc.png', 1, 'image/png', X'89504E47', CURRENT_TIMESTAMP)
            """)
        )

    descida = _alembic(url, "downgrade", "0004")
    assert descida.returncode == 0, descida.stderr
    assert "imagens_avatar" not in inspect(engine).get_table_names()
    with engine.connect() as conexao:
        avatares = conexao.execute(
            text("SELECT id, avatar_url FROM users ORDER BY id")
        ).all()
    assert avatares == [(1, ""), (2, "https://exemplo.com/a.png")]

    subida_novamente = _alembic(url, "upgrade", "head")
    assert subida_novamente.returncode == 0, subida_novamente.stderr
