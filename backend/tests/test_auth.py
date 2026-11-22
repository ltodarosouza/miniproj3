SENHA = "senha-forte-123"


def registrar(client, username="ana", name="Ana", password=SENHA):
    return client.post(
        "/auth/registro",
        json={"username": username, "name": name, "password": password},
    )


def test_registro_normaliza_username_e_nao_vaza_senha(client):
    r = registrar(client, username="  AnaMaria09 ", name="  Ana  ")

    assert r.status_code == 201
    corpo = r.json()
    assert corpo["username"] == "anamaria09"
    assert corpo["name"] == "Ana"
    assert "password" not in corpo
    assert "password_hash" not in corpo


def test_registro_recusa_username_invalido(client):
    for username in ["joão", "ana-maria", "ana.maria", "ana maria", "ab", "a" * 31]:
        r = registrar(client, username=username)
        assert r.status_code == 422, username
        assert "letras sem acento" in r.text


def test_registro_recusa_nome_vazio(client):
    r = registrar(client, name="   ")
    assert r.status_code == 422
    assert "informe seu nome" in r.text


def test_registro_recusa_senha_curta_e_longa(client):
    r = registrar(client, password="1234567")
    assert r.status_code == 422
    assert "pelo menos 8 caracteres" in r.text

    r = registrar(client, password="a" * 33)
    assert r.status_code == 422
    assert "no máximo 32 caracteres" in r.text

    r = registrar(client, password="😀" * 19)
    assert r.status_code == 422
    assert "menos emojis" in r.text


def test_senha_no_limite_de_caracteres_funciona(client):
    senha = "á" * 32
    assert registrar(client, password=senha).status_code == 201

    r = client.post("/auth/login", json={"username": "ana", "password": senha})
    assert r.status_code == 200


def test_username_duplicado_da_409(client):
    assert registrar(client).status_code == 201

    r = registrar(client, name="Outra")

    assert r.status_code == 409
    assert r.json()["detail"] == "username já existe"


def test_login_senha_errada_e_usuario_sem_hash_dao_401(client):
    registrar(client)

    r = client.post("/auth/login", json={"username": "ana", "password": "errada"})
    assert r.status_code == 401

    client.post("/usuarios", json={"username": "bia", "name": "Bia"})
    r = client.post("/auth/login", json={"username": "bia", "password": SENHA})
    assert r.status_code == 401
    assert r.json()["detail"] == "usuário ou senha inválidos"


def test_login_normaliza_username(client):
    registrar(client, username="AnaMaria09")

    r = client.post("/auth/login", json={"username": " ANAMARIA09 ", "password": SENHA})

    assert r.status_code == 200
    assert len(r.json()["token"]) >= 16


def test_eu_exige_token_valido(client, logar):
    headers = logar("ana", "Ana")

    r = client.get("/auth/eu", headers=headers)
    assert r.status_code == 200
    assert r.json()["username"] == "ana"

    assert client.get("/auth/eu").status_code == 401
    assert (
        client.get("/auth/eu", headers={"Authorization": "Bearer invalido"}).status_code
        == 401
    )


def test_logout_revoga_token_e_login_novo_gera_outro(client, logar):
    headers = logar("ana")
    token_antigo = headers["Authorization"].removeprefix("Bearer ")

    assert client.post("/auth/logout", headers=headers).status_code == 204
    assert client.get("/auth/eu", headers=headers).status_code == 401

    r = client.post("/auth/login", json={"username": "ana", "password": SENHA})
    assert r.status_code == 200
    assert r.json()["token"] != token_antigo


def test_logout_sem_token_da_401(client):
    assert client.post("/auth/logout").status_code == 401


def test_registro_incrementa_contador_de_iniciais(client):
    antes = client.get("/usuarios/stats").json()["usuarios_por_inicial"].get("a", 0)

    registrar(client)

    depois = client.get("/usuarios/stats").json()["usuarios_por_inicial"].get("a", 0)
    assert depois == antes + 1


def test_lista_publica_usa_auth_opcional(client, logar, pessoa):
    ana = logar("ana")
    pessoa("bia")
    client.post("/usuarios/bia/follow", headers=ana)

    com_token = client.get("/usuarios/ana/seguindo", headers=ana).json()
    assert com_token["items"][0]["username"] == "bia"
    assert com_token["items"][0]["eu_sigo"] is True

    sem_token = client.get("/usuarios/ana/seguindo").json()
    assert sem_token["items"][0]["eu_sigo"] is None


def test_post_usuarios_duplicado_continua_409(client):
    assert (
        client.post("/usuarios", json={"username": "ana", "name": "Ana"}).status_code
        == 201
    )

    r = client.post("/usuarios", json={"username": "ana", "name": "Outra"})
    assert r.status_code == 409
    assert r.json()["detail"] == "username já existe"
