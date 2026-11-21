from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, PlainSerializer

from app.core.tempo import como_utc, para_utc_ingenuo

DataHoraUtc = Annotated[
    datetime,
    PlainSerializer(
        lambda v: como_utc(v).isoformat().replace("+00:00", "Z"), return_type=str
    ),
]

DataHoraEntrada = Annotated[datetime, AfterValidator(para_utc_ingenuo)]
