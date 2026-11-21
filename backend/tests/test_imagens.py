import pytest

from app.services import imagens

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100
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


def test_enviar_imagem_grava_o_arquivo_e_atualiza_o_post(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    r = enviar(client, post_id, ana)

    assert r.status_code == 200
    url = r.json()["imagem_url"]
    assert url.startswith("/posts/imagens/") and url.endswith(".png")
    assert len(list(pasta_de_teste.iterdir())) == 1
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] == url


def test_imagem_enviada_pode_ser_baixada_sem_login(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)
    url = enviar(client, post_id, ana).json()["imagem_url"]

    r = client.get(url)

    assert r.status_code == 200
    assert r.content == PNG
    assert r.headers["content-type"] == "image/png"


def test_so_o_autor_envia_imagem(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = novo_post(client, ana)

    assert enviar(client, post_id, bia).status_code == 403
    assert list(pasta_de_teste.iterdir()) == []
    assert client.get(f"/posts/{post_id}", headers=ana).json()["imagem_url"] is None


def test_extensao_invalida_da_422(client, pessoa, pasta_de_teste):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    for nome in ("documento.pdf", "programa.exe", "semextensao"):
        assert enviar(client, post_id, ana, nome=nome).status_code == 422
    assert list(pasta_de_teste.iterdir()) == []


def test_limite_de_2_mb(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert enviar(client, post_id, ana, conteudo=b"0" * DOIS_MB).status_code == 200
    assert enviar(client, post_id, ana, conteudo=b"0" * (DOIS_MB + 1)).status_code == 413


def test_post_inexistente_da_404_e_sem_login_da_401(client, pessoa):
    ana = pessoa("ana")
    post_id = novo_post(client, ana)

    assert enviar(client, 9999, ana).status_code == 404
    assert enviar(client, post_id, {}).status_code == 401


def test_so_serve_arquivos_gerados_pelo_servidor(client, pasta_de_teste):
    (pasta_de_teste / "segredo.txt").write_text("não pode sair")

    assert client.get("/posts/imagens/segredo.txt").status_code == 404
    assert client.get(f"/posts/imagens/{'a' * 32}.png").status_code == 404
