import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect

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
