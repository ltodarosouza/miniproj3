# 1 arquivo por model — evita conflito de merge quando o time trabalha em paralelo.
from app.models.user import User  # noqa: F401
