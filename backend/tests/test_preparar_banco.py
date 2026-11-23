from sqlalchemy import create_engine, inspect, text

from app.db import Base
from app.main import completar_esquema_sqlite


def test_banco_sqlite_antigo_ganha_colunas_novas_sem_perder_dados(tmp_path):
    motor = create_engine(f"sqlite:///{tmp_path / 'antigo.db'}")
    with motor.begin() as conexao:
        conexao.execute(
            text(
                "CREATE TABLE mensagens (id INTEGER PRIMARY KEY, de_id INTEGER NOT NULL, "
                "para_id INTEGER NOT NULL, texto VARCHAR(1000) NOT NULL, em DATETIME NOT NULL)"
            )
        )
        conexao.execute(
            text("INSERT INTO mensagens VALUES (1, 1, 2, 'oi', '2026-11-22 10:00:00')")
        )

    Base.metadata.create_all(motor)
    completar_esquema_sqlite(motor)
    completar_esquema_sqlite(motor)

    inspetor = inspect(motor)
    colunas = {coluna["name"] for coluna in inspetor.get_columns("mensagens")}
    assert {"cliente_id", "entregue_em", "lida_em"} <= colunas
    indices = {indice["name"] for indice in inspetor.get_indexes("mensagens")}
    assert "uq_mensagens_de_cliente_id" in indices
    assert "leitura_conversas" in inspetor.get_table_names()
    with motor.connect() as conexao:
        assert conexao.execute(text("SELECT texto, lida_em FROM mensagens")).all() == [("oi", None)]
