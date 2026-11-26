import subprocess
import sys
from pathlib import Path

import pytest

from conftest import SENHA_PADRAO


def test_seguir_por_username_em_maiusculas(client, pessoa):
    ana = pessoa("ana")
    pessoa("bia")

    minusculo = client.post("/usuarios/bia/follow", headers=ana)
    maiusculo = client.post("/usuarios/BIA/follow", headers=ana)

    assert minusculo.status_code == 200
    assert maiusculo.status_code == 200
    assert maiusculo.json() == minusculo.json()


def test_resumo_avaliacoes_aceita_username_em_maiusculas(client, pessoa):
    pessoa("ana")

    minusculo = client.get("/usuarios/ana/avaliacoes")
    maiusculo = client.get("/usuarios/ANA/avaliacoes")

    assert minusculo.status_code == 200
    assert maiusculo.status_code == 200
    assert maiusculo.json() == minusculo.json()


def test_login_aceita_username_com_iniciais_maiusculas(client):
    registro = client.post(
        "/auth/registro",
        json={"username": "ana", "name": "Ana", "password": SENHA_PADRAO},
    )
    assert registro.status_code == 201

    login = client.post(
        "/auth/login", json={"username": "Ana", "password": SENHA_PADRAO}
    )

    assert login.status_code == 200
    assert login.json()["token"]


@pytest.mark.parametrize("modulo", ["users", "follows", "avaliacoes", "auth"])
def test_servico_importa_sozinho_sem_ciclo(modulo):
    resultado = subprocess.run(
        [sys.executable, "-c", f"import app.services.{modulo}"],
        cwd=Path(__file__).resolve().parents[1],
        capture_output=True,
        text=True,
    )
    assert resultado.returncode == 0, resultado.stderr
