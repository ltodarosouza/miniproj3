from pydantic import BaseModel


class ImagemOut(BaseModel):
    imagem_url: str
