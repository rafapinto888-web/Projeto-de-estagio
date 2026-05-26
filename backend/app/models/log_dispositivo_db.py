"""Modelo ORM da tabela logs_dispositivo (eventos Windows por computador)."""

# Modelo ORM dos logs associados a computadores.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class LogDispositivoDB(Base):
    """Log de seguranca ou RDP associado a um computador."""

    __tablename__ = "logs_dispositivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    computador_id: Mapped[int] = mapped_column(ForeignKey("computadores.id"))
    tipo_log: Mapped[str] = mapped_column(String(50))
    descricao: Mapped[str | None] = mapped_column(Text)
    data_evento: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    computador: Mapped["ComputadorDB"] = relationship(back_populates="logs_dispositivo")

