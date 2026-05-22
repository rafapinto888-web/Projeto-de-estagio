"""Schemas de consulta e listagem de logs de dispositivo."""

# Schemas de resposta para consulta de logs de dispositivo.
from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class LogDispositivoItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    computador_id: int
    tipo_log: str
    descricao: str | None = None
    data_evento: datetime


class LogsDispositivoRecolhaIn(BaseModel):
    """Credenciais de rede no corpo do pedido (nunca na URL)."""

    utilizador: str = Field(min_length=1)
    password: str = Field(min_length=1)
    dispositivo_id: int | None = None
    tipo_log: Literal["seguranca", "rdp"] | None = None


class LogsDispositivoConsultaResponse(BaseModel):
    """Resposta paginada de consulta de logs com filtros aplicados."""

    filtros: dict[str, str | int]
    total_logs: int
    logs: list[LogDispositivoItemResponse]

