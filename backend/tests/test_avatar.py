from io import BytesIO

import pytest
from PIL import Image
from app.services import imagens


def imagem(formato, tamanho=(2, 2)):
    buffer = BytesIO()
    Image.new("RGB", tamanho, color=(40, 120, 200)).save(buffer, format=formato)
    return buffer.getvalue()


PNG = imagem("PNG")
JPEG = imagem("JPEG")
WEBP = imagem("WEBP")
DOIS_MB = 2 * 1024 * 1024


def enviar(client, headers, nome="foto.png", conteudo=PNG):
    return client.post(
        "/usuarios/eu/avatar",
        files={"arquivo": (nome, conteudo, "image/gif" if nome.endswith(".gif") else "image/png")},
        headers=headers,
    )


def test_enviar_servir_e_exibir_avatar(client, pessoa):
    ana = pessoa("ana")
    resposta = enviar(client, ana)
    assert resposta.status_code == 200
    url = resposta.json()["avatar_url"]
    assert url.startswith("/usuarios/avatares/") and url.endswith(".png")

    imagem = client.get(url)
    assert imagem.status_code == 200
    assert imagem.content == PNG
    assert imagem.headers["cache-control"] == "public, max-age=31536000, immutable"
    assert imagem.headers["content-type"] == "image/png"
    assert imagem.headers["x-content-type-options"] == "nosniff"
    assert client.get("/usuarios/ana").json()["avatar_url"] == url


def test_enviar_novamente_troca_avatar(client, pessoa):
    ana = pessoa("ana")
    primeira = enviar(client, ana).json()["avatar_url"]
    segunda = enviar(client, ana).json()["avatar_url"]
    assert segunda != primeira
    assert client.get(primeira).status_code == 404
    assert client.get(segunda).status_code == 200


def test_remover_avatar(client, pessoa):
    ana = pessoa("ana")
    url = enviar(client, ana).json()["avatar_url"]
    assert client.delete("/usuarios/eu/avatar", headers=ana).status_code == 204
    assert client.get("/usuarios/ana").json()["avatar_url"] == ""
    assert client.get(url).status_code == 404


def test_validacao_de_upload_e_login(client, pessoa):
    ana = pessoa("ana")
    assert enviar(client, ana, nome="foto.gif", conteudo=b"GIF89a").status_code == 422
    assert enviar(client, ana, conteudo=PNG + b"0" * (DOIS_MB + 1 - len(PNG))).status_code == 413
    assert enviar(client, {}).status_code == 401
    assert client.delete("/usuarios/eu/avatar").status_code == 401


@pytest.mark.parametrize("conteudo,tipo,extensao", [(JPEG, "image/jpeg", ".jpg"), (PNG, "image/png", ".png"), (WEBP, "image/webp", ".webp")])
def test_formatos_reais_sao_aceitos_e_servidos(client, pessoa, conteudo, tipo, extensao):
    ana = pessoa("ana")
    resposta = enviar(client, ana, nome="foto.jpg", conteudo=conteudo)
    assert resposta.status_code == 200
    url = resposta.json()["avatar_url"]
    assert url.endswith(extensao)
    servido = client.get(url)
    assert servido.headers["content-type"] == tipo
    assert servido.headers["x-content-type-options"] == "nosniff"


@pytest.mark.parametrize("conteudo", [b"", b"<html>erro</html>"])
def test_conteudo_invalido_nao_substitui_avatar(client, pessoa, conteudo):
    ana = pessoa("ana")
    url = enviar(client, ana).json()["avatar_url"]
    resposta = enviar(client, ana, nome="foto.png", conteudo=conteudo)
    assert resposta.status_code == 422
    assert client.get(url).content == PNG


@pytest.mark.parametrize("conteudo", [PNG[: len(PNG) // 2], JPEG[: len(JPEG) // 2]])
def test_imagem_truncada_nao_substitui_avatar(client, pessoa, conteudo):
    ana = pessoa("ana")
    url = enviar(client, ana).json()["avatar_url"]

    resposta = enviar(client, ana, conteudo=conteudo)

    assert resposta.status_code == 422
    assert client.get(url).status_code == 200
    assert client.get("/usuarios/ana").json()["avatar_url"] == url


def test_avatar_acima_do_limite_de_pixels_e_recusado(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    monkeypatch.setattr(imagens, "MAX_PIXELS", 3)

    assert enviar(client, ana).status_code == 422


def test_nome_de_avatar_invalido_ou_inexistente(client):
    assert client.get("/usuarios/avatares/abc.png").status_code == 404
    assert client.get("/usuarios/avatares/../x.png").status_code == 404
