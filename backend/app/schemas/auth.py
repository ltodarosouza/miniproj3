from pydantic import BaseModel, Field, field_validator


def _minusculo_sem_espacos(valor: object) -> object:
    if isinstance(valor, str):
        return valor.strip().lower()
    return valor


class RegistroIn(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-z0-9_]+$")
    name: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=8)

    @field_validator("username", mode="before")
    @classmethod
    def normalizar_username(cls, valor: object) -> object:
        return _minusculo_sem_espacos(valor)

    @field_validator("name", mode="before")
    @classmethod
    def limpar_nome(cls, valor: object) -> object:
        return valor.strip() if isinstance(valor, str) else valor

    @field_validator("password")
    @classmethod
    def senha_cabe_no_bcrypt(cls, valor: str) -> str:
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("a senha deve ter no máximo 72 bytes")
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
