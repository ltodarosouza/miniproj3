PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100
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
    assert enviar(client, ana, nome="foto.gif").status_code == 422
    assert enviar(client, ana, conteudo=b"0" * (DOIS_MB + 1)).status_code == 413
    assert enviar(client, {}).status_code == 401
    assert client.delete("/usuarios/eu/avatar").status_code == 401


def test_nome_de_avatar_invalido_ou_inexistente(client):
    assert client.get("/usuarios/avatares/abc.png").status_code == 404
    assert client.get("/usuarios/avatares/../x.png").status_code == 404
