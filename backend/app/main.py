from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.core.contadores import contador_iniciais
from app.core.matches import indice_matches
from app.db import Base, SessionLocal, engine
import app.models  # noqa: F401
from app.models.user import User
from app.models.user_habilidade import UserHabilidade
from app.routers import avaliacoes, dms, habilidades, posts, trocas, users
from app.services.habilidades import garantir_catalogo


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        garantir_catalogo(db)
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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1 linha por feature — registre o seu router aqui.
app.include_router(users.router)
app.include_router(habilidades.router)
app.include_router(dms.router)
app.include_router(avaliacoes.router)
app.include_router(trocas.router)
app.include_router(posts.router)