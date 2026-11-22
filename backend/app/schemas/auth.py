import re

from pydantic import BaseModel, Field, field_validator

PADRAO_USERNAME = re.compile(r"^[a-z0-9_]{3,30}$")


def _minusculo_sem_espacos(valor: object) -> object:
    if isinstance(valor, str):
        return valor.strip().lower()
    return valor


class RegistroIn(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=30,
        pattern=r"^[a-z0-9_]+$",
        description="3 a 30 letras sem acento, números ou _",
    )
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8, max_length=32)

    @field_validator("username", mode="before")
    @classmethod
    def normalizar_username(cls, valor: object) -> object:
        normalizado = _minusculo_sem_espacos(valor)
        if isinstance(normalizado, str) and not PADRAO_USERNAME.fullmatch(normalizado):
            raise ValueError(
                "no nome de usuário, use de 3 a 30 letras sem acento, números ou _"
            )
        return normalizado

    @field_validator("name", mode="before")
    @classmethod
    def limpar_nome(cls, valor: object) -> object:
        if not isinstance(valor, str):
            return valor
        limpo = valor.strip()
        if not limpo:
            raise ValueError("informe seu nome")
        if len(limpo) > 80:
            raise ValueError("o nome deve ter no máximo 80 caracteres")
        return limpo

    @field_validator("password", mode="before")
    @classmethod
    def validar_senha(cls, valor: object) -> object:
        if not isinstance(valor, str):
            return valor
        if len(valor) < 8:
            raise ValueError("a senha deve ter pelo menos 8 caracteres")
        if len(valor) > 32:
            raise ValueError("a senha deve ter no máximo 32 caracteres")
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("sua senha tem caracteres especiais demais; use menos emojis")
        return valor


class LoginIn(BaseModel):
    username: str
    password: str

    @field_validator("username", mode="before")
    @classmethod
    def normalizar_username(cls, valor: object) -> object:
        return _minusculo_sem_espacos(valor)


class TokenOut(BaseModel):
    token: str
