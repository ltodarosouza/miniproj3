from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.streak import calcular_streak
from app.core.tempo import agora_utc
from app.models.post import Post


def streak_do_usuario(db: Session, usuario_id: int) -> int:
    momentos = db.scalars(select(Post.created_at).where(Post.autor_id == usuario_id))
    dias = {momento.date() for momento in momentos}
    return calcular_streak(dias, agora_utc().date())
