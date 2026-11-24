from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.streak import calcular_streak, dia_no_brasil
from app.core.tempo import agora_utc
from app.models.post import Post


def streak_do_usuario(db: Session, usuario_id: int) -> int:
    momentos = db.scalars(select(Post.created_at).where(Post.autor_id == usuario_id))
    dias = {dia_no_brasil(momento) for momento in momentos}
    return calcular_streak(dias, dia_no_brasil(agora_utc()))
