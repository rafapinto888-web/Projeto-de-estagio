# Modelo ORM dos logs de acoes do sistema.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class LogSistemaDB(Base):
    __tablename__ = "logs_sistema"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    utilizador_id: Mapped[int] = mapped_column(
        ForeignKey("utilizadores.id"), nullable=False, index=True
    )
    acao: Mapped[str] = mapped_column(String(100), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    data_evento: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    utilizador: Mapped["UtilizadorDB"] = relationship(back_populates="logs_sistema")
