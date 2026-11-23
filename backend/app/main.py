import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

load_dotenv()

from app.core.contadores import contador_iniciais
from app.core.matches import indice_matches
from app.db import EH_SQLITE, Base, SessionLocal, engine
import app.models  # noqa: F401
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.routers import (
    auth,
    avaliacoes,
    dms,
    feed,
    follows,
    habilidades,
    matches,
    notificacoes,
    posts,
    trocas,
    users,
)
from app.services.habilidades import garantir_catalogo, reconstruir_trie

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


ORIGEM_LOCAL = "http://localhost:3000"


def origens_permitidas() -> list[str]:
    extras = os.environ.get("CORS_ORIGINS", "")
    origens = [ORIGEM_LOCAL]
    for origem in extras.split(","):
        origem = origem.strip().rstrip("/")
        if origem and origem not in origens:
            origens.append(origem)
    return origens


def semear_se_vazio(db) -> None:
    if os.environ.get("SEED_ON_BOOT") != "true":
        return
    if db.scalar(select(User.id).limit(1)) is not None:
        return
    from scripts.seed import seed_fake

    seed_fake(db)


def preparar_banco() -> None:
    if EH_SQLITE:
        Base.metadata.create_all(engine)
        return
    from alembic import command
    from alembic.config import Config

    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    config.attributes["configurar_log"] = False
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    preparar_banco()
    with SessionLocal() as db:
        garantir_catalogo(db)
        reconstruir_trie(db)
        semear_se_vazio(db)
        usernames = list(db.scalars(select(User.username)))
        indice_matches.reconstruir(
            [
                (uh.usuario_id, uh.habilidade_id, uh.tipo)
                for uh in db.scalars(select(UserHabilidade))
            ]
        )
    contador_iniciais.reconstruir(usernames)
    yield


app = FastAPI(title="Rede Social da Trilha", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/saude", tags=["saude"])
def saude() -> dict[str, bool]:
    return {"ok": True}


# 1 linha por feature — registre o seu router aqui.
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(habilidades.router)
app.include_router(dms.router)
app.include_router(avaliacoes.router)
app.include_router(trocas.router)
app.include_router(follows.router)
app.include_router(matches.router)
app.include_router(posts.router)
app.include_router(feed.router)
app.include_router(notificacoes.router)
