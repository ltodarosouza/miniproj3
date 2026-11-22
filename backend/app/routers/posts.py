from fastapi import APIRouter, Depends, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.comentario import ComentarioCreate, ComentarioOut, ComentarioPage
from app.schemas.imagem import ImagemOut
from app.schemas.post import PostCreate, PostOut, PostUpdate
from app.services import comentarios, curtidas, imagens, posts

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def criar_post(
    dados: PostCreate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.criar(db, eu, dados)


@router.get("/imagens/{nome}", tags=["imagens"])
def ver_imagem(nome: str) -> FileResponse:
    return FileResponse(imagens.caminho(nome))


@router.get("/{post_id}", response_model=PostOut)
def detalhar_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.detalhar(db, eu, post_id)


@router.patch("/{post_id}", response_model=PostOut)
def editar_post(
    post_id: int,
    dados: PostUpdate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> PostOut:
    return posts.editar(db, eu, post_id, dados)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    posts.apagar(db, eu, post_id)


@router.post("/{post_id}/imagem", response_model=ImagemOut, tags=["imagens"])
async def enviar_imagem(
    post_id: int,
    arquivo: UploadFile,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> ImagemOut:
    return ImagemOut(imagem_url=await imagens.salvar(db, eu, post_id, arquivo))


@router.post(
    "/{post_id}/curtir",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["curtidas"],
)
def curtir_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    curtidas.curtir(db, eu, post_id)


@router.delete(
    "/{post_id}/curtir",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["curtidas"],
)
def descurtir_post(
    post_id: int,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> None:
    curtidas.descurtir(db, eu, post_id)


@router.post(
    "/{post_id}/comentarios",
    response_model=ComentarioOut,
    status_code=status.HTTP_201_CREATED,
    tags=["comentarios"],
)
def criar_comentario(
    post_id: int,
    dados: ComentarioCreate,
    db: Session = Depends(get_db),
    eu: User = Depends(get_current_user),
) -> ComentarioOut:
    return comentarios.criar(db, eu, post_id, dados)


@router.get(
    "/{post_id}/comentarios",
    response_model=ComentarioPage,
    dependencies=[Depends(get_current_user)],
    tags=["comentarios"],
)
def listar_comentarios(
    post_id: int,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ComentarioPage:
    return comentarios.listar(db, post_id, offset, limit)