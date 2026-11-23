from logging.config import fileConfig

from alembic import context

import app.models  # noqa: F401
from app.db import Base, engine

config = context.config

if config.config_file_name is not None and config.attributes.get("configurar_log", True):
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def rodar_offline() -> None:
    context.configure(
        url=str(engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=engine.dialect.name == "sqlite",
    )
    with context.begin_transaction():
        context.run_migrations()


def rodar_online() -> None:
    with engine.connect() as conexao:
        context.configure(
            connection=conexao,
            target_metadata=target_metadata,
            render_as_batch=conexao.dialect.name == "sqlite",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    rodar_offline()
else:
    rodar_online()
