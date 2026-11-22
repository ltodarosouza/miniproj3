from datetime import date, timedelta


def calcular_streak(dias_com_post: set[date], hoje: date) -> int:
    ultimo = hoje if hoje in dias_com_post else hoje - timedelta(days=1)
    total = 0
    while ultimo - timedelta(days=total) in dias_com_post:
        total += 1
    return total
