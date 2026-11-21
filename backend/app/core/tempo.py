from datetime import datetime, timezone


def agora_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def para_utc_ingenuo(valor: datetime) -> datetime:
    if valor.tzinfo is None:
        return valor
    return valor.astimezone(timezone.utc).replace(tzinfo=None)


def como_utc(valor: datetime) -> datetime:
    if valor.tzinfo is None:
        return valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(timezone.utc)
