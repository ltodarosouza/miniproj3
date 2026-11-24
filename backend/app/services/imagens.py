import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.imagem_post import ImagemPost
from app.models.user import User
from app.services.posts import post_do_autor

# Pasta antiga: só lida, para imagens enviadas antes da decisão 19.
PASTA = Path("uploads")
TIPOS = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}
MAX_BYTES = 2 * 1024 * 1024
NOME_VALIDO = re.compile(r"^[0-9a-f]{32}\.(png|jpg|jpeg|webp)$")
UM_ANO = "public, max-age=31536000, immutable"


def descobrir_extensao(nome: str | None, content_type: str | None) -> str | None:
    extensao = Path(nome or "").suffix.lower()
    if extensao in TIPOS:
        return extensao
    extensoes_por_tipo = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    return extensoes_por_tipo.get(content_type or "")


async def salvar(db: Session, eu: User, post_id: int, arquivo: UploadFile) -> str:
    post = post_do_autor(db, eu, post_id)
    extensao = descobrir_extensao(arquivo.filename, arquivo.content_type)
    if extensao not in TIPOS:
        raise HTTPException(status_code=422, detail="envie uma imagem jpg, png ou webp")
    conteudo = await arquivo.read(MAX_BYTES + 1)
    if len(conteudo) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="arquivo maior que 2 MB")
    nome = f"{uuid.uuid4().hex}{extensao}"
    db.execute(delete(ImagemPost).where(ImagemPost.post_id == post.id))
    db.add(ImagemPost(nome=nome, post_id=post.id, tipo=TIPOS[extensao], conteudo=conteudo))
    post.imagem_url = f"/posts/imagens/{nome}"
    db.commit()
    return post.imagem_url


def remover(db: Session, eu: User, post_id: int) -> None:
    post = post_do_autor(db, eu, post_id)
    db.execute(delete(ImagemPost).where(ImagemPost.post_id == post.id))
    post.imagem_url = None
    db.commit()


def servir(db: Session, nome: str) -> Response:
    if not NOME_VALIDO.match(nome):
        raise HTTPException(status_code=404, detail="imagem não encontrada")
    imagem = db.get(ImagemPost, nome)
    if imagem is not None:
        return Response(imagem.conteudo, media_type=imagem.tipo, headers={"Cache-Control": UM_ANO})
    if (PASTA / nome).is_file():
        return FileResponse(PASTA / nome)
    raise HTTPException(status_code=404, detail="imagem não encontrada")
