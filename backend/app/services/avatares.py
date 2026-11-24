import uuid

from fastapi import HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.imagem_avatar import ImagemAvatar
from app.models.user import User
from app.services.imagens import MAX_BYTES, NOME_VALIDO, TIPOS, UM_ANO, detectar_formato


async def salvar(db: Session, eu: User, arquivo: UploadFile) -> str:
    conteudo = await arquivo.read(MAX_BYTES + 1)
    if len(conteudo) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="arquivo maior que 2 MB")
    extensao = detectar_formato(conteudo)
    if extensao is None:
        raise HTTPException(status_code=422, detail="envie uma imagem jpg, png ou webp")
    nome = f"{uuid.uuid4().hex}{extensao}"
    db.execute(delete(ImagemAvatar).where(ImagemAvatar.usuario_id == eu.id))
    db.add(ImagemAvatar(nome=nome, usuario_id=eu.id, tipo=TIPOS[extensao], conteudo=conteudo))
    eu.avatar_url = f"/usuarios/avatares/{nome}"
    try:
        db.commit()
    except IntegrityError as erro:
        db.rollback()
        raise HTTPException(status_code=409, detail="outro envio de foto está em andamento, tente de novo") from erro
    return eu.avatar_url


def remover(db: Session, eu: User) -> None:
    db.execute(delete(ImagemAvatar).where(ImagemAvatar.usuario_id == eu.id))
    eu.avatar_url = ""
    db.commit()


def servir(db: Session, nome: str) -> Response:
    if not NOME_VALIDO.fullmatch(nome):
        raise HTTPException(status_code=404, detail="imagem não encontrada")
    imagem = db.scalar(select(ImagemAvatar).where(ImagemAvatar.nome == nome))
    if imagem is None:
        raise HTTPException(status_code=404, detail="imagem não encontrada")
    return Response(imagem.conteudo, media_type=imagem.tipo, headers={"Cache-Control": UM_ANO, "X-Content-Type-Options": "nosniff"})
