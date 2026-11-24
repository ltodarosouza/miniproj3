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


@pytest.fixture(autouse=True)
def pasta_de_teste(tmp_path, monkeypatch):
    monkeypatch.setattr(imagens, "PASTA", tmp_path)
    return tmp_path


def novo_post(client, headers):
    return client.post("/posts", json={"texto": "estudei"}, headers=headers).json()["id"]


def enviar(client, post_id, headers, nome="foto.png", conteudo=PNG):
    return client.post(
        f"/posts/{post_id}/imagem",
        files={"arquivo": (nome, conteudo, "image/png")},
        headers=headers,
    )


def test_enviar_imagem_grava_no_banco_e_nao_no_disco(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    r = enviar(client, post_id, ana)

    assert r.status_code == 200
    url = r.json()["imagem_url"]
    assert url.startswith("/posts/imagens/") and url.endswith(".png")
    assert list(pasta_de_teste.iterdir()) == []
    assert client.get(url).content == PNG
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] == url


def test_imagem_enviada_pode_ser_baixada_sem_login(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    r = client.get(url)

    assert r.status_code == 200
    assert r.content == PNG
    assert r.headers["content-type"] == "image/png"
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "immutable" in r.headers["cache-control"]


def test_trocar_a_imagem_apaga_a_anterior(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    primeira = enviar(client, post_id, ana).json()["imagem_url"]

    segunda_resp = enviar(client, post_id, ana, nome="outra.webp", conteudo=WEBP)
    assert segunda_resp.status_code == 200
    segunda = segunda_resp.json()["imagem_url"]

    assert client.get(primeira).status_code == 404
    assert client.get(segunda).headers["content-type"] == "image/webp"


def test_apagar_o_post_apaga_a_imagem(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    assert client.delete(f"/posts/{post_id}", headers=ana).status_code == 204
    assert client.get(url).status_code == 404


def test_imagem_antiga_no_disco_continua_servida(client, pasta_de_teste):
    nome = f"{'b' * 32}.jpg"
    (pasta_de_teste / nome).write_bytes(b"jpeg antigo")

    r = client.get(f"/posts/imagens/{nome}")

    assert r.status_code == 200
    assert r.content == b"jpeg antigo"


def test_so_o_autor_envia_imagem(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = novo_post(client, ana)

    assert enviar(client, post_id, bia).status_code == 403
    assert list(pasta_de_teste.iterdir()) == []
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] is None


def test_autor_remove_imagem(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    r = client.delete(f"/posts/{post_id}/imagem", headers=ana)

    assert r.status_code == 204
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] is None
    assert client.get(url).status_code == 404


def test_remover_post_sem_imagem(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert client.delete(f"/posts/{post_id}/imagem", headers=ana).status_code == 204


def test_so_o_autor_remove_imagem(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    r = client.delete(f"/posts/{post_id}/imagem", headers=bia)

    assert r.status_code == 403
    assert r.json()["detail"] == "só o autor pode mexer neste post"
    assert client.get(url).status_code == 200


def test_remover_imagem_sem_login(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert client.delete(f"/posts/{post_id}/imagem").status_code == 401


def test_extensao_invalida_da_422(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    for nome in ("documento.pdf", "programa.exe", "semextensao"):
        r = client.post(
            f"/posts/{post_id}/imagem",
            files={"arquivo": (nome, b"<html>invalid</html>", "application/pdf")},
            headers=ana,
        )
        assert r.status_code == 422
    assert list(pasta_de_teste.iterdir()) == []


def test_content_type_define_extensao_sem_extensao_no_nome(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    jpeg = client.post(
        f"/posts/{post_id}/imagem",
        files={"arquivo": ("image", JPEG, "image/jpeg")},
        headers=ana,
    )
    webp = client.post(
        f"/posts/{post_id}/imagem",
        files={"arquivo": ("blob", WEBP, "image/webp")},
        headers=ana,
    )
    pdf = client.post(
        f"/posts/{post_id}/imagem",
        files={"arquivo": ("foto", b"not an image", "application/pdf")},
        headers=ana,
    )

    assert jpeg.status_code == 200
    assert jpeg.json()["imagem_url"].endswith(".jpg")
    assert webp.status_code == 200
    assert webp.json()["imagem_url"].endswith(".webp")
    assert pdf.status_code == 422


def test_formato_detectado_ignora_nome_e_content_type(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    resposta = client.post(f"/posts/{post_id}/imagem", files={"arquivo": ("foto.jpg", PNG, "image/jpeg")}, headers=ana)
    assert resposta.status_code == 200
    assert resposta.json()["imagem_url"].endswith(".png")
    assert client.get(resposta.json()["imagem_url"]).headers["content-type"] == "image/png"


@pytest.mark.parametrize("conteudo", [b"", b"<html>erro</html>"])
def test_conteudo_invalido_nao_substitui_imagem(client, pessoa, conteudo):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]
    resposta = enviar(client, post_id, ana, nome="foto.png", conteudo=conteudo)
    assert resposta.status_code == 422
    assert client.get(url).content == PNG


@pytest.mark.parametrize("conteudo,tipo", [(JPEG, "image/jpeg"), (PNG, "image/png"), (WEBP, "image/webp")])
def test_formatos_reais_sao_aceitos_e_servidos(client, pessoa, conteudo, tipo):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    resposta = enviar(client, post_id, ana, conteudo=conteudo)
    assert resposta.status_code == 200
    servido = client.get(resposta.json()["imagem_url"])
    assert servido.headers["content-type"] == tipo
    assert servido.headers["x-content-type-options"] == "nosniff"


def test_limite_de_2_mb(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert enviar(client, post_id, ana, conteudo=PNG + b"0" * (DOIS_MB - len(PNG))).status_code == 200
    assert enviar(client, post_id, ana, conteudo=b"0" * (DOIS_MB + 1)).status_code == 413


@pytest.mark.parametrize("conteudo", [PNG[: len(PNG) // 2], JPEG[: len(JPEG) // 2]])
def test_imagem_truncada_nao_substitui_a_anterior(client, pessoa, conteudo):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    resposta = enviar(client, post_id, ana, conteudo=conteudo)

    assert resposta.status_code == 422
    assert client.get(url).status_code == 200
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] == url


def test_imagem_acima_do_limite_de_pixels_e_recusada(client, pessoa, monkeypatch):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    monkeypatch.setattr(imagens, "MAX_PIXELS", 3)

    assert enviar(client, post_id, ana).status_code == 422


def test_post_inexistente_da_404_e_sem_login_da_401(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert enviar(client, 9999, ana).status_code == 404
    assert enviar(client, post_id, {}).status_code == 401


def test_so_serve_arquivos_gerados_pelo_servidor(client, pasta_de_teste):
    (pasta_de_teste / "segredo.txt").write_text("não pode sair")

    assert client.get("/posts/imagens/segredo.txt").status_code == 404
    assert client.get(f"/posts/imagens/{'a' * 32}.png").status_code == 404
