from datetime import date, timedelta

from app.core.streak import calcular_streak
from app.core.tempo import agora_utc
from app.db import SessionLocal
from app.models.post import Post
from app.services.streak import streak_do_usuario

HOJE = date(2026, 11, 21)


def dias_atras(*quantos: int) -> set[date]:
    return {HOJE - timedelta(days=n) for n in quantos}


def test_sem_posts_o_streak_e_zero():
    assert calcular_streak(set(), HOJE) == 0


def test_post_so_hoje_conta_um():
    assert calcular_streak(dias_atras(0), HOJE) == 1


def test_streak_continua_se_o_ultimo_post_foi_ontem():
    assert calcular_streak(dias_atras(1, 2, 3), HOJE) == 3


def test_streak_zera_depois_de_dois_dias_sem_postar():
    assert calcular_streak(dias_atras(2, 3, 4), HOJE) == 0


def test_buraco_no_meio_corta_a_contagem():
    assert calcular_streak(dias_atras(0, 1, 3, 4), HOJE) == 2


def test_streak_do_usuario_conta_so_os_posts_dele(client, pessoa):
    ana = int(pessoa("ana")["X-User-Id"])
    bia = int(pessoa("bia")["X-User-Id"])
    with SessionLocal() as db:
        for dias in (0, 1, 2):
            db.add(
                Post(
                    autor_id=ana,
                    texto="estudei",
                    created_at=agora_utc() - timedelta(days=dias),
                )
            )
        db.add(Post(autor_id=ana, texto="outro no mesmo dia", created_at=agora_utc()))
        db.add(Post(autor_id=bia, texto="só hoje", created_at=agora_utc()))
        db.commit()

        assert streak_do_usuario(db, ana) == 3
        assert streak_do_usuario(db, bia) == 1
        assert streak_do_usuario(db, 9999) == 0


def test_post_criado_pela_api_conta_no_streak(client, pessoa):
    ana = pessoa("ana")
    client.post("/posts", json={"texto": "estudei hoje"}, headers=ana)

    with SessionLocal() as db:
        assert streak_do_usuario(db, int(ana["X-User-Id"])) == 1
