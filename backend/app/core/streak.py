from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

FUSO_BRASIL = ZoneInfo("America/Sao_Paulo")


def dia_no_brasil(momento_utc: datetime) -> date:
    if momento_utc.tzinfo is None:
        momento_utc = momento_utc.replace(tzinfo=timezone.utc)
    return momento_utc.astimezone(FUSO_BRASIL).date()


def calcular_streak(dias_com_post: set[date], hoje: date) -> int:
    ultimo = hoje if hoje in dias_com_post else hoje - timedelta(days=1)
    total = 0
    while ultimo - timedelta(days=total) in dias_com_post:
        total += 1
    return total
