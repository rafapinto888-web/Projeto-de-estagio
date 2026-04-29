# Modelo ORM dos logs associados a computadores.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class LogDispositivoDB(Base):
    __tablename__ = "logs_dispositivo"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    computador_id: Mapped[int] = mapped_column(
        ForeignKey("computadores.id"), nullable=False, index=True
    )
    tipo_log: Mapped[str] = mapped_column(String(50), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_evento: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    computador: Mapped["ComputadorDB"] = relationship(back_populates="logs_dispositivo")
