import logging

import httpx

from app.db import SessionLocal
from app.services import habilidades, ia_mapeador


def _mapear_com_banco(client, monkeypatch, resposta):
    client.get("/habilidades/autocomplete?prefixo=python")
    monkeypatch.setenv("IA_PROVIDER", "openai")
    monkeypatch.setenv("IA_API_KEY", "chave-secreta-123")
    monkeypatch.setattr(ia_mapeador, "_chamar_openai_compativel", lambda *args: resposta)
    with SessionLocal() as db:
        return habilidades.mapear_texto(db, "pyton")


def test_ia_resposta_python_minusculo_retorna_nome_original(client, monkeypatch):
    habilidade = _mapear_com_banco(client, monkeypatch, "python")
    assert habilidade.nome == "Python"


def test_ia_resposta_sem_acento_retorna_nome_original(client, monkeypatch):
    habilidade = _mapear_com_banco(client, monkeypatch, "calculo 1")
    assert habilidade.nome == "Cálculo 1"


def test_ia_nenhuma_cai_no_difflib(client, monkeypatch):
    habilidade = _mapear_com_banco(client, monkeypatch, "NENHUMA")
    assert habilidade.nome == "Python"


def test_falha_ia_cai_no_difflib_sem_registrar_chave(client, monkeypatch, caplog):
    client.get("/habilidades/autocomplete?prefixo=python")
    monkeypatch.setenv("IA_PROVIDER", "openai")
    monkeypatch.setenv("IA_API_KEY", "chave-secreta-123")

    def falhar(*args):
        raise RuntimeError("erro usando chave-secreta-123")

    monkeypatch.setattr(ia_mapeador, "_chamar_openai_compativel", falhar)
    with caplog.at_level(logging.WARNING), SessionLocal() as db:
        habilidade = habilidades.mapear_texto(db, "pyton")

    assert habilidade.nome == "Python"
    assert "chave-secreta-123" not in caplog.text
    assert "RuntimeError" in caplog.text


def test_gemini_envia_chave_no_header(monkeypatch):
    chamadas = {}

    class Resposta:
        def raise_for_status(self):
            return None

        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": "Python"}]}}]}

    class Cliente:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return None

        def post(self, url, **kwargs):
            chamadas["url"] = url
            chamadas.update(kwargs)
            return Resposta()

    monkeypatch.setattr(httpx, "Client", Cliente)
    resultado = ia_mapeador._chamar_gemini(
        "chave-secreta-123",
        "https://generativelanguage.googleapis.com/v1beta",
        "gemini-1.5-flash",
        ["Python"],
        "pyton",
    )

    assert resultado == "Python"
    assert "chave-secreta-123" not in chamadas["url"]
    assert chamadas["headers"]["x-goog-api-key"] == "chave-secreta-123"
