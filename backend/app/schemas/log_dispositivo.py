# Schemas de resposta para consulta de logs de dispositivo.
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LogDispositivoItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    computador_id: int
    tipo_log: str
    descricao: str | None = None
    data_evento: datetime


class LogsDispositivoConsultaResponse(BaseModel):
    filtros: dict[str, str | int]
    total_logs: int
    logs: list[LogDispositivoItemResponse]
