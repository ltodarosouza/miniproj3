import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.posts import post_do_autor

PASTA = Path("uploads")
EXTENSOES = {".png", ".jpg", ".jpeg", ".webp"}
MAX_BYTES = 2 * 1024 * 1024
NOME_VALIDO = re.compile(r"^[0-9a-f]{32}\.(png|jpg|jpeg|webp)$")


async def salvar(db: Session, eu: User, post_id: int, arquivo: UploadFile) -> str:
    post = post_do_autor(db, eu, post_id)
    extensao = Path(arquivo.filename or "").suffix.lower()
    if extensao not in EXTENSOES:
        raise HTTPException(status_code=422, detail="envie uma imagem jpg, png ou webp")
    conteudo = await arquivo.read(MAX_BYTES + 1)
    if len(conteudo) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="arquivo maior que 2 MB")
    PASTA.mkdir(parents=True, exist_ok=True)
    nome = f"{uuid.uuid4().hex}{extensao}"
    (PASTA / nome).write_bytes(conteudo)
    post.imagem_url = f"/posts/imagens/{nome}"
    db.commit()
    return post.imagem_url


def caminho(nome: str) -> Path:
    if not NOME_VALIDO.match(nome) or not (PASTA / nome).is_file():
        raise HTTPException(status_code=404, detail="imagem não encontrada")
    return PASTA / nome
