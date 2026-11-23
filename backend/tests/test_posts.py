def test_criar_post_devolve_201_com_autor(client, pessoa):
    ana = pessoa("ana", "Ana")

    r = client.post(
        "/posts",
        json={"texto": "  estudei react  ", "minutos_estudados": 90},
        headers=ana,
    )

    assert r.status_code == 201
    corpo = r.json()
    assert corpo["texto"] == "estudei react"
    assert corpo["autor"]["username"] == "ana"
    assert corpo["minutos_estudados"] == 90
    assert corpo["curtidas"] == 0
    assert corpo["created_at"].endswith("Z")


def test_criar_post_com_habilidade_do_catalogo(client, pessoa):
    ana = pessoa("ana")
    habilidade = client.get("/habilidades").json()["items"][0]

    r = client.post(
        "/posts",
        json={"texto": "estudando", "habilidade_id": habilidade["id"]},
        headers=ana,
    )

    assert r.status_code == 201
    assert r.json()["habilidade"]["id"] == habilidade["id"]


def test_habilidade_inexistente_da_422(client, pessoa):
    ana = pessoa("ana")

    r = client.post("/posts", json={"texto": "oi", "habilidade_id": 9999}, headers=ana)

    assert r.status_code == 422


def test_post_vazio_da_422_e_sem_login_da_401(client, pessoa):
    ana = pessoa("ana")

    assert client.post("/posts", json={"texto": "   "}, headers=ana).status_code == 422
    assert client.post("/posts", json={"texto": "oi"}).status_code == 401


def test_buscar_post_existente_e_inexistente(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "meu post"}, headers=ana).json()["id"]

    r = client.get(f"/posts/{post_id}", headers=ana)

    assert r.status_code == 200
    assert r.json()["texto"] == "meu post"
    assert client.get("/posts/9999", headers=ana).status_code == 404

    

def test_editar_post_so_muda_o_que_foi_enviado(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post(
        "/posts", json={"texto": "original", "minutos_estudados": 30}, headers=ana
    ).json()["id"]

    r = client.patch(f"/posts/{post_id}", json={"texto": "  editado  "}, headers=ana)

    assert r.status_code == 200
    assert r.json()["texto"] == "editado"
    assert r.json()["minutos_estudados"] == 30


def test_editar_pode_limpar_minutos_com_null(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post(
        "/posts", json={"texto": "oi", "minutos_estudados": 30}, headers=ana
    ).json()["id"]

    r = client.patch(f"/posts/{post_id}", json={"minutos_estudados": None}, headers=ana)

    assert r.status_code == 200
    assert r.json()["minutos_estudados"] is None
    assert r.json()["texto"] == "oi"


def test_editar_com_texto_vazio_ou_nulo_da_422(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    for corpo in ({"texto": "   "}, {"texto": None}):
        assert client.patch(f"/posts/{post_id}", json=corpo, headers=ana).status_code == 422


def test_editar_post_de_outra_pessoa_da_403(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "meu post"}, headers=ana).json()["id"]

    r = client.patch(f"/posts/{post_id}", json={"texto": "invadido"}, headers=bia)

    assert r.status_code == 403
    assert client.get(f"/posts/{post_id}", headers=ana).json()["texto"] == "meu post"


def test_apagar_post_so_o_autor(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "apague-me"}, headers=ana).json()["id"]

    assert client.delete(f"/posts/{post_id}", headers=bia).status_code == 403
    assert client.delete(f"/posts/{post_id}", headers=ana).status_code == 204
    assert client.get(f"/posts/{post_id}", headers=ana).status_code == 404
    assert client.delete(f"/posts/{post_id}", headers=ana).status_code == 404


def test_editar_post_inexistente_da_404(client, pessoa):
    ana = pessoa("ana")

    assert client.patch("/posts/9999", json={"texto": "x"}, headers=ana).status_code == 404

def test_post_novo_nao_vem_como_editado(client, pessoa):
    ana = pessoa("ana")

    r = client.post("/posts", json={"texto": "oi"}, headers=ana)

    assert r.json()["editado_em"] is None


def test_editar_preenche_editado_em(client, pessoa):
    ana = pessoa("ana")
    post = client.post("/posts", json={"texto": "oi"}, headers=ana).json()

    r = client.patch(f"/posts/{post['id']}", json={"texto": "oi de novo"}, headers=ana)

    assert r.json()["editado_em"] is not None
    assert r.json()["editado_em"] >= post["created_at"]
    assert client.get(f"/posts/{post['id']}", headers=ana).json()["editado_em"] == r.json()["editado_em"]


def test_salvar_sem_mudar_nada_nao_marca_editado(client, pessoa):
    ana = pessoa("ana")
    post_id = client.post("/posts", json={"texto": "oi"}, headers=ana).json()["id"]

    r = client.patch(f"/posts/{post_id}", json={"texto": "oi"}, headers=ana)

    assert r.json()["editado_em"] is None


def test_editar_de_outra_pessoa_nao_marca_editado(client, pessoa):
    ana = pessoa("ana")
    bia = pessoa("bia")
    post_id = client.post("/posts", json={"texto": "meu"}, headers=ana).json()["id"]

    client.patch(f"/posts/{post_id}", json={"texto": "invadido"}, headers=bia)

    assert client.get(f"/posts/{post_id}", headers=ana).json()["editado_em"] is None
